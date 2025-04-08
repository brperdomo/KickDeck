import { ComplexCard } from '@/components/admin/ComplexCard';
import { Complex } from '@/types/complex';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

// Example complex data
const exampleComplex: Complex = {
  id: 1,
  name: 'Riverside Soccer Complex',
  description: 'Premier soccer fields with state-of-the-art facilities.\nIncludes 8 full-size fields, concessions, and parking.',
  address: '1234 Riverside Drive',
  city: 'Springfield',
  state: 'IL',
  country: 'USA',
  zipCode: '62701',
  phoneNumber: '(555) 123-4567',
  email: 'info@riversidecomplex.com',
  website: 'riversidecomplex.com',
  // Geographic coordinates
  latitude: 39.781721,
  longitude: -89.650148,
  // Operating hours
  openTime: '08:00',
  closeTime: '22:00',
  // Sharing settings
  shared: true,
  sharedId: 'rc-12345',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export default function ComplexExample() {
  const handleEdit = (complex: Complex) => {
    console.log('Edit complex:', complex);
    alert(`Editing complex: ${complex.name}`);
  };

  const handleViewFields = (complex: Complex) => {
    console.log('View fields for complex:', complex);
    alert(`Viewing fields for: ${complex.name}`);
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Complex Example</h1>
        <Link href="/admin/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Standard View</h2>
          <ComplexCard 
            complex={exampleComplex}
            onEdit={handleEdit}
            onViewFields={handleViewFields}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">With Map Visible</h2>
          <ComplexCard 
            complex={exampleComplex}
            onEdit={handleEdit}
            onViewFields={handleViewFields}
            showMap={true}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Show Sharing Status</h2>
          <ComplexCard 
            complex={exampleComplex}
            onEdit={handleEdit}
            onViewFields={handleViewFields}
            showShareStatus={true}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Read-Only (No Actions)</h2>
          <ComplexCard 
            complex={exampleComplex}
          />
        </div>
      </div>
    </div>
  );
}