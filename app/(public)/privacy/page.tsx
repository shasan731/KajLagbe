export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="container-app py-10 max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-gray-700">
        We collect only the information needed to operate the marketplace: your name, phone, optional email, and the listing/booking data you create. Passwords are stored as bcrypt hashes. We do not sell your data.
      </p>
      <p className="text-gray-700">
        Image URLs you provide are publicly served by their original host. Avoid uploading sensitive content. Audit logs are retained for moderation purposes.
      </p>
    </div>
  );
}
