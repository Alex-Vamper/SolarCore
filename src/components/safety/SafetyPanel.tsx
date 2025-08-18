import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SafetyPanel({ system, onManualOverride, onSystemSettings }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Safety System</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Safety panel component - placeholder</p>
      </CardContent>
    </Card>
  );
}