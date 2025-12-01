export interface IUser {
  username: string;
  password: string;
}

export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface IAirport {
  code: string;
  name: string;
}

export interface IFlight {
  flightId: number;
  flightCode: string;
  departure: {
    airportCode: string;
    airportName: string;
    departureTime: string;
  };
  arrival: {
    airportCode: string;
    airportName: string;
    arrivalTime: string;
  };
  airline: string;
  price: number;
  duration: number;
}

export interface IFlightPriceInfo {
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  total: number;
}

export interface IPassengers {
  adults: number;
  children: number;
  infants: number;
}

export interface IPricingRule {
  adult: {
    price_multiplier: number;
    description: string;
  };
  child: {
    price_multiplier: number;
    description: string;
  };
  infant: {
    price_multiplier: number;
    description: string;
  };
}

export interface ISelectedFlights {
  departureFlight?: IFlight;
  returnFlight?: IFlight;
  passengers?: IPassengers;
  price?: IFlightPriceInfo;
  tripType?: "one-way" | "round-trip";
}

export interface IFlightResponse {
  status: string;
  data: IFlight[];
}

export interface BookingHistory {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  idNumber: string;
  departureFlightId?: number;
  returnFlightId?: number;
  adults: number;
  children: number;
  infants: number;
  totalPrice: number;
  ipAddress: string;
  createdAt: Date;
  updatedAt: Date;
}


export interface ICompanyInfo {
  company_name: string;
  address: string;
  hotline: string;
  email: string;
}

export interface IAirline {
  name: string;
  logoUrl: string;
}

export interface ContactFormData {
    fullName: string;
    email: string;
    phone: string;
    message: string;
}