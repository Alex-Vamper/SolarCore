import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EnergyOverview({ energyData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Energy Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Energy data component - placeholder</p>
      </CardContent>
    </Card>
  );
}