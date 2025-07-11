
import { NextResponse } from 'next/server';
import type { Region } from '@/lib/types';

// This data rarely changes, so it's fine to hardcode it here.
const allRegionsDB: Region[] = [
    { id: 'us-east-1', name: 'US East (N. Virginia)' },
    { id: 'us-east-2', name: 'US East (Ohio)' },
    { id: 'us-west-1', name: 'US West (N. California)' },
    { id: 'us-west-2', name: 'US West (Oregon)' },
    { id: 'af-south-1', name: 'Africa (Cape Town)' },
    { id: 'ap-east-1', name: 'Asia Pacific (Hong Kong)' },
    { id: 'ap-south-1', name: 'Asia Pacific (Mumbai)' },
    { id: 'ap-south-2', name: 'Asia Pacific (Hyderabad)' },
    { id: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)' },
    { id: 'ap-northeast-2', name: 'Asia Pacific (Seoul)' },
    { id: 'ap-northeast-3', name: 'Asia Pacific (Osaka)' },
    { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
    { id: 'ap-southeast-2', name: 'Asia Pacific (Sydney)' },
    { id: 'ap-southeast-3', name: 'Asia Pacific (Jakarta)' },
    { id: 'ap-southeast-4', name: 'Asia Pacific (Melbourne)' },
    { id: 'ca-central-1', name: 'Canada (Central)' },
    { id: 'eu-central-1', name: 'Europe (Frankfurt)' },
    { id: 'eu-central-2', name: 'Europe (Zurich)' },
    { id: 'eu-west-1', name: 'Europe (Ireland)' },
    { id: 'eu-west-2', name: 'Europe (London)' },
    { id: 'eu-west-3', name: 'Europe (Paris)' },
    { id: 'eu-south-1', name: 'Europe (Milan)' },
    { id: 'eu-south-2', name: 'Europe (Spain)' },
    { id: 'eu-north-1', name: 'Europe (Stockholm)' },
    { id: 'me-south-1', name: 'Middle East (Bahrain)' },
    { id: 'me-central-1', name: 'Middle East (UAE)' },
    { id: 'sa-east-1', name: 'South America (São Paulo)' },
];

export async function GET() {
    return NextResponse.json(allRegionsDB);
}
