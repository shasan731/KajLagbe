export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="container-app py-10 max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-gray-700">
        By using KajLagbe, you agree to these terms. The MVP is provided as-is and is intended for legitimate rental and service exchanges in Bangladesh.
      </p>
      <p className="text-gray-700">
        Users must be 18 or older. Listings must comply with Bangladeshi law and the platform's banned/restricted policies. The platform is not party to any rental contract; it facilitates connections and acts only as mediator in disputes.
      </p>
    </div>
  );
}
