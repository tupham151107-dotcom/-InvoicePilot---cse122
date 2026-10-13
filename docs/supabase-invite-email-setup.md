# Supabase invitation email setup

The member invitation flow includes a temporary password in the Supabase Auth **Invite user** email template. Configure a custom SMTP provider in Supabase Auth first; the default SMTP service is restricted and not suitable for sending to arbitrary team addresses. Never put SMTP credentials in this repository or in browser code.

In the Supabase Dashboard, open **Authentication → Email Templates → Invite user** and use the HTML in [`supabase-invite-email-template.html`](supabase-invite-email-template.html). The template reads the one-time `initial_password` value from `auth.users.user_metadata`; the Edge Function clears that metadata immediately after requesting the invite, so the password is not retained on the Auth user record. Supabase Auth sends the template using the invite request's metadata.

The invited member can sign in with the emailed temporary password. The app detects the pending invite and requires a new password before routing to their role's page.

Supabase setup references:

- [Configure custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Auth email templates and `.Data`](https://supabase.com/docs/guides/auth/auth-email-templates)
