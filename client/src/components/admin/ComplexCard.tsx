import React, { useState } from "react";
import { MapPin, Clock, Users, Loader2, MoreHorizontal, Edit, Eye, MapIcon } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatAddress } from "@/lib/format-address";

interface Complex {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: string | null;
  longitude?: string | null;
  openTime: string;
  closeTime: string;
  rules?: string | null;
  directions?: string | null;
  isOpen: boolean;
  fields?: any[];
}

interface ComplexCardProps {
  complex: Complex;
  onEditComplex: (complex: Complex) => void;
  onViewFields: (complexId: number) => void;
  isExpanded?: boolean;
}

export function ComplexCard({ complex, onEditComplex, onViewFields, isExpanded = false }: ComplexCardProps) {
  const [showMap, setShowMap] = useState(false);
  const hasCoordinates = complex.latitude && complex.longitude;
  const fieldCount = complex.fields?.length || 0;
  
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold">{complex.name}</h3>
            <div className="flex items-center text-muted-foreground text-sm mt-1">
              <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
              <span className="truncate">{formatAddress(complex)}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditComplex(complex)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewFields(complex.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View Fields
              </DropdownMenuItem>
              {hasCoordinates && (
                <DropdownMenuItem onClick={() => setShowMap(!showMap)}>
                  <MapIcon className="mr-2 h-4 w-4" />
                  {showMap ? 'Hide Map' : 'Show Map'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <div>
              <span className="text-sm font-medium">Hours: </span>
              <span className="text-sm">{complex.openTime} - {complex.closeTime}</span>
            </div>
          </div>
          
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            <div>
              <span className="text-sm font-medium">Fields: </span>
              <span className="text-sm">{fieldCount}</span>
            </div>
          </div>
        </div>
        
        {/* Conditionally rendered map */}
        {showMap && hasCoordinates && (
          <div className="mt-3 h-48 bg-muted rounded-md flex items-center justify-center">
            <iframe
              title={`Map for ${complex.name}`}
              className="w-full h-full rounded-md"
              src={`https://www.google.com/maps/embed/v1/place?key=${process.env.GOOGLE_MAPS_API_KEY || ''}&q=${complex.latitude},${complex.longitude}&zoom=15`}
              allowFullScreen
            />
          </div>
        )}
        
        {/* Directions section - conditionally displayed if expanded and directions exist */}
        {isExpanded && complex.directions && (
          <div className="mt-3">
            <h4 className="text-sm font-medium mb-1">Directions</h4>
            <p className="text-sm text-muted-foreground">{complex.directions}</p>
          </div>
        )}
        
        {/* Rules section - conditionally displayed if expanded and rules exist */}
        {isExpanded && complex.rules && (
          <div className="mt-3">
            <h4 className="text-sm font-medium mb-1">Rules</h4>
            <p className="text-sm text-muted-foreground">{complex.rules}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between">
        <Badge variant={complex.isOpen ? "success" : "destructive"}>
          {complex.isOpen ? "Open" : "Closed"}
        </Badge>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEditComplex(complex)}
          >
            Edit
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => onViewFields(complex.id)}
          >
            View Fields
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}