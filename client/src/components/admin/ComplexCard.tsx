import React, { useState } from 'react';
import { MapPin, Phone, Mail, Globe, Clock, ChevronDown, ChevronUp, ExternalLink, X, Edit, Trash } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGoogleMapsScript } from '@/hooks/use-google-maps-script';
import { formatAddress, formatHours, getDirectionsUrl, getGoogleMapsUrl } from '@/lib/format-address';
import { Complex } from '@/types/complex';
import { Field } from '@/types/field';

interface ComplexCardProps {
  complex: Complex;
  fields?: Field[];
  onEdit?: () => void;
  onDelete?: () => void;
  showMapByDefault?: boolean;
}

export default function ComplexCard({
  complex,
  fields = [],
  onEdit,
  onDelete,
  showMapByDefault = false,
}: ComplexCardProps) {
  const [showMap, setShowMap] = useState<boolean>(showMapByDefault);
  const [mapExpanded, setMapExpanded] = useState<boolean>(false);
  const { loaded } = useGoogleMapsScript();
  
  // Sort fields by whether they're open or not
  const openFields = fields.filter(field => field.isOpen);
  const closedFields = fields.filter(field => !field.isOpen);
  
  // Initialize map once script is loaded and container is ready
  const initializeMap = (container: HTMLDivElement) => {
    if (!loaded || !container) return;
    
    const mapOptions: google.maps.MapOptions = {
      center: { lat: complex.latitude, lng: complex.longitude },
      zoom: 15,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: true,
    };
    
    const map = new google.maps.Map(container, mapOptions);
    
    // Add marker for the complex
    new google.maps.Marker({
      position: { lat: complex.latitude, lng: complex.longitude },
      map,
      title: complex.name,
      animation: google.maps.Animation.DROP,
    });
    
    // Add info window with complex info
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="max-width: 200px;">
          <h3 style="margin: 0; font-weight: bold;">${complex.name}</h3>
          <p style="margin: 5px 0;">${formatAddress(complex)}</p>
          <a href="${getDirectionsUrl(complex)}" target="_blank" rel="noopener noreferrer" style="color: #0077CC;">Get Directions</a>
        </div>
      `,
    });
    
    // Open info window by default
    infoWindow.open(map, map.markers?.[0]);
  };
  
  return (
    <Card className="w-full max-w-2xl shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{complex.name}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <MapPin size={16} className="mr-1" />
              <span>{formatAddress(complex)}</span>
            </div>
          </div>
          
          {complex.shared && (
            <Badge variant="secondary" className="ml-2">
              Shared
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-2 pb-2">
        {/* Contact Information */}
        <div className="grid grid-cols-1 gap-2 mb-4">
          {complex.phoneNumber && (
            <div className="flex items-center text-sm">
              <Phone size={16} className="mr-2 text-muted-foreground" />
              <a href={`tel:${complex.phoneNumber}`} className="hover:underline">
                {complex.phoneNumber}
              </a>
            </div>
          )}
          
          {complex.email && (
            <div className="flex items-center text-sm">
              <Mail size={16} className="mr-2 text-muted-foreground" />
              <a href={`mailto:${complex.email}`} className="hover:underline">
                {complex.email}
              </a>
            </div>
          )}
          
          {complex.website && (
            <div className="flex items-center text-sm">
              <Globe size={16} className="mr-2 text-muted-foreground" />
              <a 
                href={complex.website.startsWith('http') ? complex.website : `https://${complex.website}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline flex items-center"
              >
                {complex.website.replace(/^https?:\/\//, '')}
                <ExternalLink size={12} className="ml-1" />
              </a>
            </div>
          )}
          
          {(complex.openTime || complex.closeTime) && (
            <div className="flex items-center text-sm">
              <Clock size={16} className="mr-2 text-muted-foreground" />
              <span>{formatHours(complex)}</span>
            </div>
          )}
        </div>
        
        {/* Description */}
        {complex.description && (
          <div className="mb-4 text-sm">
            <p>{complex.description}</p>
          </div>
        )}
        
        {/* Fields Section */}
        {fields.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Fields ({fields.length})</h3>
            
            {openFields.length > 0 && (
              <div className="mb-2">
                <h4 className="text-xs font-medium text-green-600 mb-1">Open ({openFields.length})</h4>
                <div className="flex flex-wrap gap-1">
                  {openFields.map(field => (
                    <Badge key={field.id} variant="outline" className="bg-green-50">
                      {field.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {closedFields.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-red-600 mb-1">Closed ({closedFields.length})</h4>
                <div className="flex flex-wrap gap-1">
                  {closedFields.map(field => (
                    <Badge key={field.id} variant="outline" className="bg-red-50">
                      {field.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Map Section */}
        {showMap && (
          <div className={`mt-4 border rounded-md overflow-hidden transition-all ${mapExpanded ? 'h-96' : 'h-48'}`}>
            {loaded ? (
              <div 
                ref={initializeMap}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            )}
            
            <div className="absolute bottom-2 right-2">
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-8 px-2 bg-white shadow"
                onClick={() => setMapExpanded(!mapExpanded)}
              >
                {mapExpanded ? (
                  <>
                    <ChevronDown size={16} className="mr-1" />
                    <span>Collapse</span>
                  </>
                ) : (
                  <>
                    <ChevronUp size={16} className="mr-1" />
                    <span>Expand</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowMap(!showMap)}
          >
            {showMap ? (
              <>
                <X size={16} className="mr-1" />
                <span>Hide Map</span>
              </>
            ) : (
              <>
                <MapPin size={16} className="mr-1" />
                <span>Show Map</span>
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(getGoogleMapsUrl(complex), '_blank')}
          >
            <ExternalLink size={16} className="mr-1" />
            <span>View in Maps</span>
          </Button>
        </div>
        
        {(onEdit || onDelete) && (
          <div className="flex gap-2">
            {onEdit && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onEdit}
              >
                <Edit size={16} className="mr-1" />
                <span>Edit</span>
              </Button>
            )}
            
            {onDelete && (
              <Button 
                variant="ghost" 
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={onDelete}
              >
                <Trash size={16} className="mr-1" />
                <span>Delete</span>
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}