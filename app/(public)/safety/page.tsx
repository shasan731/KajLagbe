export const metadata = { title: "Safety" };

export default function SafetyPage() {
  return (
    <div className="container-app py-10 max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold">Safety guidelines</h1>
      <p className="text-gray-700">
        Your safety is our priority. Please follow these guidelines when renting tools or hiring services.
      </p>
      <h2 className="text-xl font-semibold pt-4">Banned items</h2>
      <p className="text-gray-700">
        Listings for weapons, explosives, fireworks, illegal drugs, alcohol, gambling, prescription medicine, fake documents, spy devices, adult services, stolen goods, hazardous chemicals, and exam cheating services are strictly prohibited.
      </p>
      <h2 className="text-xl font-semibold pt-4">Restricted items</h2>
      <p className="text-gray-700">
        Listings for heavy machinery, gas-line repair, electrical work, medical equipment, childcare, high-value cameras, and generators require admin approval.
      </p>
      <h2 className="text-xl font-semibold pt-4">Tips</h2>
      <ul className="list-disc pl-5 text-gray-700 space-y-1">
        <li>Meet in safe public places when possible.</li>
        <li>Take handover photos of the tool's condition before pickup and after return.</li>
        <li>Keep all communication inside the booking thread.</li>
        <li>If something goes wrong, raise a dispute — admins will mediate.</li>
      </ul>
    </div>
  );
}
