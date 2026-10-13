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
      return json({ error: 'Thiếu cấu hình Supabase cho chức năng xóa thành viên.' }, 500);
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
    const { data: caller, error: callerError } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('id', userData.user.id)
      .single();
    if (callerError || caller?.role !== 'admin') {
      return json({ error: 'Chỉ Quản trị viên mới được xóa tài khoản thành viên.' }, 403);
    }

    const body = await request.json();
    const memberId = String(body.member_id || '').trim();
    if (!memberId || memberId === caller.id) return json({ error: 'Không thể xóa tài khoản của chính bạn.' }, 400);

    const { data: member, error: memberError } = await adminClient
      .from('profiles')
      .select('id, email, role')
      .eq('id', memberId)
      .eq('company_admin_id', caller.id)
      .single();
    if (memberError || !member || member.role === 'admin') {
      return json({ error: 'Không tìm thấy thành viên thuộc doanh nghiệp của bạn.' }, 404);
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(member.id);
    if (deleteError) {
      console.error('delete-member auth deletion failed:', deleteError);
      return json({ error: 'Không xóa được tài khoản. Hãy thử lại.' }, 500);
    }

    if (member.email) {
      const { error: inviteError } = await adminClient.from('member_invites').delete().eq('email', member.email);
      if (inviteError) console.error('delete-member invite cleanup failed:', inviteError);
    }

    return json({ id: member.id, email: member.email, deleted: true });
  } catch (error) {
    console.error('delete-member failed:', error);
    return json({ error: 'Không thể xóa tài khoản lúc này. Vui lòng thử lại.' }, 500);
  }
});
