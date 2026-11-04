import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const CONTACT_EMAIL = 'welllabs.jaltol@ifmr.ac.in';
const LAST_UPDATED = '31 October 2026';

const Mail = () => (
  <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#347745] font-semibold underline underline-offset-2">
    {CONTACT_EMAIL}
  </a>
);

const PRIVACY = {
  title: 'Privacy Policy',
  intro: (
    <>
      Climate Solutions (climatesolutions.ai) is a platform run by WELL Labs for mapping flood risk, groundwater and
      Blue-Green-Grey infrastructure projects in Bengaluru. This policy explains what personal information we collect,
      why we collect it, and how you can control it.
    </>
  ),
  sections: [
    {
      heading: 'Information we collect',
      items: [
        <>
          <strong>When you sign in with Google:</strong> your name, email address, profile picture and Google account ID.
          We do not receive your Google password, and we do not access your Gmail, Google Drive, contacts or any other
          Google data.
        </>,
        <>
          <strong>When you register or complete your profile:</strong> your name, email address, the role you choose
          (for example Funder, Consultant, Government official or Citizen), user type, phone number, address,
          organization, a short profile, areas of interest, focus themes and past projects. Funders may also give a
          Corporate Identification Number (CIN). If you register with email and password, we store your password only
          in an encrypted (hashed) form that cannot be read back.
        </>,
        <>
          <strong>When you contact a consultant:</strong> if you click “Show interest” and confirm, we send the details
          shown in the confirmation window (your name, email, role, organization, phone and the project) and any message
          you add.
        </>,
        <>
          <strong>Security information:</strong> the time of your last sign-in; for failed sign-in attempts, the email
          address entered and the IP address; and a record of actions administrators take on accounts.
        </>,
      ],
    },
    {
      heading: 'Why we collect it',
      items: [
        'To create your account, sign you in and keep you signed in.',
        'To show the maps, projects and tools that match your role.',
        'To send emails you ask for, such as password reset links and account invitations.',
        'To pass your interest on to the consultant you chose, so they can reply to you.',
        'To keep the platform secure and prevent misuse.',
        'We do not sell your information and we do not use it for advertising.',
      ],
    },
    {
      heading: 'Cookies and browser storage',
      items: [
        'We use a sign-in cookie and your browser’s local storage to keep you signed in. They are removed when you sign out.',
        'We do not use advertising or analytics cookies.',
      ],
    },
    {
      heading: 'Who we share it with',
      items: [
        <>
          <strong>Consultants you choose to contact:</strong> only after you confirm in the “Show interest” window.
        </>,
        <>
          <strong>Service providers that run the platform for us:</strong> MongoDB Atlas (database hosting), Amazon Web
          Services (servers and email delivery) and Google (sign-in). They process data only to provide these services.
        </>,
        <>
          <strong>Map images:</strong> your browser loads map images directly from OpenStreetMap, which receives your IP
          address as part of that request.
        </>,
        <>
          <strong>When required by law:</strong> if we must share information to comply with a legal obligation.
        </>,
      ],
    },
    {
      heading: 'How we store and protect it',
      items: [
        'Your information is stored in a cloud database (MongoDB Atlas) and the platform runs on Amazon Web Services.',
        'Data is sent over encrypted connections (HTTPS), passwords are stored only as hashes, and sign-in attempts are rate limited.',
        'Only authorized administrators can view or manage user accounts.',
        'No online service is completely secure, but we work to protect your information.',
      ],
    },
    {
      heading: 'How long we keep it',
      items: [
        'Account information is kept while your account exists.',
        'Records of failed sign-in attempts are deleted automatically after 90 days.',
      ],
    },
    {
      heading: 'Your choices: access, correction and deletion',
      items: [
        <>
          To see, correct or delete your account and personal data, email <Mail /> from the email address on your
          account. We will confirm your request and then delete your account and the personal data linked to it.
        </>,
        <>
          You can also remove Climate Solutions’ access to your Google account at any time at{' '}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noreferrer"
            className="text-[#347745] font-semibold underline underline-offset-2"
          >
            myaccount.google.com/permissions
          </a>
          .
        </>,
      ],
    },
    {
      heading: 'Changes to this policy',
      items: ['If we change this policy, we will update this page and the date at the top.'],
    },
    {
      heading: 'Contact',
      items: [
        <>
          For any privacy question or request, email <Mail />.
        </>,
      ],
    },
  ],
};

const TERMS = {
  title: 'Terms of Service',
  intro: (
    <>
      These terms apply to your use of Climate Solutions (climatesolutions.ai), a platform run by WELL Labs. By creating
      an account or using the platform, you agree to them.
    </>
  ),
  sections: [
    {
      heading: 'Using the platform',
      items: [
        'Climate Solutions provides maps, project information and planning tools about flood risk, groundwater and Blue-Green-Grey infrastructure in Bengaluru.',
        'Some features depend on the role you choose when you sign up.',
      ],
    },
    {
      heading: 'Your account and responsibilities',
      items: [
        'Give accurate information when you register and keep it up to date.',
        'Keep your password safe. You are responsible for activity on your account.',
        'Use only your own account, and do not create accounts for other people without their permission.',
        'When you contact a consultant through the platform, make sure your message is honest and relevant to the project.',
      ],
    },
    {
      heading: 'What you must not do',
      items: [
        'Try to access accounts, data or parts of the platform you are not allowed to use.',
        'Disrupt, overload or attack the platform, or scrape its data in bulk.',
        'Send spam or misleading messages to consultants or other users.',
        'Upload or submit false, harmful or unlawful content.',
        'Pretend to be another person or organization.',
      ],
    },
    {
      heading: 'Information on the platform',
      items: [
        'Maps, project details, costs, runoff estimates and design drawings are provided for information and planning. They are estimates, not engineering, financial or legal advice. Check them with qualified professionals before acting on them.',
        'Climate Solutions does not process payments. A funding commitment you download is a summary of your selection. Any funding agreement is made directly between you and the parties involved.',
        'Some data comes from public sources and partners and may be incomplete or out of date.',
      ],
    },
    {
      heading: 'Suspension and termination',
      items: [
        'We may suspend or remove accounts that break these terms or put the platform or other users at risk.',
        <>
          You can stop using the platform at any time and ask us to delete your account by emailing <Mail />.
        </>,
      ],
    },
    {
      heading: 'Limitations and liability',
      items: [
        'The platform is provided “as is”. We work to keep it accurate and available, but we cannot promise it will always be error-free or uninterrupted.',
        'To the extent the law allows, WELL Labs is not liable for losses that result from using, or being unable to use, the platform or its information.',
      ],
    },
    {
      heading: 'Changes to these terms',
      items: ['We may update these terms. We will update this page and the date at the top. Continuing to use the platform means you accept the updated terms.'],
    },
    {
      heading: 'Contact',
      items: [
        <>
          Questions about these terms? Email <Mail />.
        </>,
      ],
    },
  ],
};

const LegalPage = ({ kind }) => {
  const page = kind === 'terms' ? TERMS : PRIVACY;

  useEffect(() => {
    document.title = `${page.title} · Climate Solutions`;
    window.scrollTo(0, 0);
    return () => {
      document.title = 'Climate Solutions';
    };
  }, [page.title]);

  return (
    <div className="min-h-screen bg-[#f2f6ee] text-[#1F2A24]">
      <header className="bg-white border-b border-[#C8D7BC]">
        <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <Link to="/" className="font-bold text-base sm:text-lg text-[#1F2A24] no-underline">
            Climate Solutions
          </Link>
          <nav className="flex gap-4 text-xs sm:text-sm font-semibold">
            <Link to="/privacy-policy" className={kind === 'terms' ? 'text-[#6E6455] no-underline hover:text-[#347745]' : 'text-[#347745] no-underline'}>
              Privacy Policy
            </Link>
            <Link to="/terms" className={kind === 'terms' ? 'text-[#347745] no-underline' : 'text-[#6E6455] no-underline hover:text-[#347745]'}>
              Terms of Service
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-[860px] mx-auto px-4 sm:px-6 py-8 sm:py-12 text-left">
        <h1 className="m-0 text-2xl sm:text-3xl font-bold tracking-tight">{page.title}</h1>
        <p className="m-0 mt-2 text-sm text-[#6E6455]">Last updated: {LAST_UPDATED}</p>
        <p className="mt-6 mb-0 text-[15px] leading-relaxed">{page.intro}</p>

        {page.sections.map((section) => (
          <section key={section.heading} className="mt-8">
            <h2 className="m-0 text-lg sm:text-xl font-bold">{section.heading}</h2>
            <ul className="mt-3 mb-0 pl-5 flex flex-col gap-2 text-[15px] leading-relaxed list-disc">
              {section.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        ))}

        <p className="mt-12 mb-0 text-sm">
          <Link to="/" className="text-[#347745] font-semibold no-underline hover:underline">
            ← Back to Climate Solutions
          </Link>
        </p>
      </main>
    </div>
  );
};

export default LegalPage;
