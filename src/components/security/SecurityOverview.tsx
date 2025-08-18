import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SecurityOverview({ onSecurityModeToggle, onSecuritySettings }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Security overview component - placeholder</p>
      </CardContent>
    </Card>
  );
}