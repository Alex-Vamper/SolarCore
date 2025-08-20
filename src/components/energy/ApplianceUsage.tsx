import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ApplianceUsage({ rooms }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appliance Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Appliance usage component - placeholder</p>
      </CardContent>
    </Card>
  );
}