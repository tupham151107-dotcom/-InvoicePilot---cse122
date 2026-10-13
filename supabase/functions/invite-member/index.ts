import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://tupham151107-dotcom.github.io',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'Vui lòng đăng nhập lại.' }, 401);

  try {
    const url = Deno.env.get('SUPABASE_URL');
    const publishableKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !publishableKey || !serviceRoleKey) {
      return json({ error: 'Thiếu cấu hình Supabase cho chức năng mời thành viên.' }, 500);
    }

    const callerClient = createClient(url, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await callerClient.auth.getUser();
    if (userError || !userData.user) return json({ error: 'Phiên đăng nhập không hợp lệ.' }, 401);

    const adminClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: inviter, error: inviterError } = await adminClient
      .from('profiles')
      .select('id, role, company_name, tax_code')
      .eq('id', userData.user.id)
      .single();
    if (inviterError || inviter?.role !== 'admin') return json({ error: 'Chỉ Quản trị viên mới được mời thành viên.' }, 403);

    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const fullName = String(body.full_name || '').trim();
    const role = String(body.role || '');
    if (!/^\S+@\S+\.\S+$/.test(email) || !fullName) return json({ error: 'Vui lòng nhập họ tên và email hợp lệ.' }, 400);
    if (!['manager', 'accountant', 'sales'].includes(role)) return json({ error: 'Vai trò thành viên không hợp lệ.' }, 400);
    if (!inviter.company_name || !inviter.tax_code) return json({ error: 'Hãy hoàn tất thông tin doanh nghiệp trước khi mời thành viên.' }, 400);

    await adminClient.from('member_invites').delete().eq('email', email).lt('expires_at', new Date().toISOString());
    const { error: pendingError } = await adminClient.from('member_invites').insert({
      email,
      company_admin_id: inviter.id,
      company_name: inviter.company_name,
      tax_code: inviter.tax_code,
      full_name: fullName,
      role,
    });
    if (pendingError) return json({ error: pendingError.code === '23505' ? 'Email này đang có lời mời chưa hoàn tất.' : 'Không tạo được lời mời thành viên.' }, 400);

    const redirectTo = 'https://tupham151107-dotcom.github.io/-InvoicePilot---cse122/common/index.html';
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        company_name: inviter.company_name,
        tax_code: inviter.tax_code,
        role,
      },
      redirectTo,
    });
    if (inviteError) {
      await adminClient.from('member_invites').delete().eq('email', email);
      return json({ error: inviteError.message }, 400);
    }

    const { error: profileError } = await adminClient.from('profiles').upsert({
      id: inviteData.user.id,
      email,
      full_name: fullName,
      company_name: inviter.company_name,
      tax_code: inviter.tax_code,
      role,
      company_admin_id: inviter.id,
      invite_status: 'invited',
    });
    if (profileError) return json({ error: 'Đã gửi lời mời nhưng chưa lưu được hồ sơ thành viên.' }, 500);

    return json({ email, full_name: fullName, role, status: 'invited' }, 201);
  } catch (error) {
    console.error('invite-member failed:', error);
    return json({ error: 'Không thể gửi lời mời lúc này. Vui lòng thử lại.' }, 500);
  }
});
