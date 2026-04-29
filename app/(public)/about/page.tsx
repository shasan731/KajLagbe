import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="container-app py-10 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">About {APP_NAME}</h1>
      <p className="text-gray-700 mb-6">{APP_TAGLINE}</p>
      <div className="prose max-w-none text-gray-800 space-y-4">
        <p>
          {APP_NAME} is a community-built marketplace for renting tools and hiring skilled people across Bangladesh. Whether you need a drill machine for an afternoon, a plumber for a quick fix, or a sound system with technician for an event, you can find a verified neighbour ready to help.
        </p>
        <p>
          Providers can earn extra income by listing items they already own or skills they already have. Customers save money by paying only when they need something — without buying expensive tools they may use only twice a year.
        </p>
        <h2 className="text-xl font-semibold pt-4">How it works</h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Browse local listings or search by category.</li>
          <li>Request a booking with your preferred date and time.</li>
          <li>Provider accepts and you submit payment proof manually.</li>
          <li>Once payment is verified, the booking is confirmed.</li>
          <li>After completion, both parties review each other.</li>
        </ol>
      </div>
    </div>
  );
}
