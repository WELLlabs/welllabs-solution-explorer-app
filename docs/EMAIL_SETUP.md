# Email setup (Brevo SMTP)

The backend sends real emails for: admin forgot password, admin invite / reset links, and funder "Show interest" emails to consultants. The code is in `backend/src/utils/mailer.js` and needs only the settings below.

## 1. Brevo (done by WELL Labs)

1. **Domain**: `climatesolutions.ai` is authenticated in Brevo (Settings → Senders, domains, IPs → Domains). Done.
2. **Sender**: Settings → Senders, domains, IPs → Senders → **Add a sender**
   - Name: `Climate Solutions`
   - Email: `no-reply@climatesolutions.ai`
3. **SMTP key**: Settings → **SMTP & API** → SMTP tab → **Generate a new SMTP key** (name it `climate-solutions-backend`). Copy it once; Brevo will not show it again.
   The same page shows the **SMTP server**, **port** and **login** (an address like `xxxx@smtp-brevo.com`).

## 2. Backend settings

| Setting | Value |
| :--- | :--- |
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | SMTP login from the Brevo SMTP & API page |
| `SMTP_PASS` | the SMTP key from step 3 |
| `MAIL_FROM` | `Climate Solutions <no-reply@climatesolutions.ai>` |

- **Local**: add them to `backend/.env` and restart the backend.
- **Beta and production**: add the same five keys to the app's AWS Secrets Manager secret (the JSON that `devops/scripts/after_install.sh` turns into the server `.env`), then redeploy.

## 3. AWS (done by the AWS team)

1. Add the five keys above to the Secrets Manager secret used by **beta** and **production**.
2. Make sure the backend EC2 instances can make **outbound** connections to `smtp-relay.brevo.com` on **TCP port 587** (security group / network ACL egress). Port 25 is not used.
3. Redeploy beta, then production, so the servers pick up the new settings.

No SES setup, DNS change or extra AWS service is needed: the domain is already authenticated in Brevo, and Brevo delivers the emails.

## 4. Test

- **Admin forgot password**: admin sign-in page → Forgot password → the reset email arrives at `welllabs.jaltol@ifmr.ac.in`.
- **Invite**: Admin portal → User management → Invite a user → the invite arrives at that user's inbox.
- **Show interest**: sign in as a funder → a project → Find Consultants → WELL Labs → Show interest → Confirm and send.

If an email does not arrive, check the backend log for lines starting with `[mail]`, and Brevo → **Transactional** → **Logs**.

## Notes

- Brevo's free plan allows **300 emails per day**, which is enough for these emails.
- Keep the SMTP key secret. If it leaks, delete it in Brevo and generate a new one.
