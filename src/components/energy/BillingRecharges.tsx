import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Receipt, 
  CreditCard, 
  Plus, 
  TrendingUp,
  DollarSign,
  Clock,
  Scan,
  Zap,
  Battery
} from "lucide-react";

export default function BillingRecharges({ energyData }) {
  const [unitsRemaining, setUnitsRemaining] = useState(0); // kWh units - defaults to 0
  const [rechargeHistory, setRechargeHistory] = useState([]); // No hard-coded history

  const [newRecharge, setNewRecharge] = useState({
    amount: "",
    method: "card"
  });

  const currentUnitRate = 0; // ₦ per kWh - will be set from backend when available
  const data = energyData || { daily_usage: 0, current_usage: 0 };
  const estimatedDaysLeft = data.daily_usage > 0 ? Math.round(unitsRemaining / data.daily_usage) : 0;

  const handleAddRecharge = () => {
    if (newRecharge.amount && currentUnitRate > 0) {
      const units = parseFloat(newRecharge.amount) / currentUnitRate;
      const recharge = {
        id: Date.now(),
        amount: parseFloat(newRecharge.amount),
        units: units,
        date: new Date().toISOString().split('T')[0],
        method: newRecharge.method === "card" ? "Card" : "Transfer",
        balance: rechargeHistory[0]?.balance + parseFloat(newRecharge.amount) || parseFloat(newRecharge.amount)
      };
      
      setRechargeHistory(prev => [recharge, ...prev]);
      setUnitsRemaining(prev => prev + units);
      setNewRecharge({ amount: "", method: "card" });
    }
  };

  const getTotalRecharges = () => {
    return rechargeHistory.reduce((sum, recharge) => sum + recharge.amount, 0);
  };

  const getAverageRecharge = () => {
    return rechargeHistory.length > 0 ? getTotalRecharges() / rechargeHistory.length : 0;
  };

  const getUnitsColor = () => {
    if (unitsRemaining > 100) return "text-green-600";
    if (unitsRemaining > 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-4">
      {/* Units Status */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-inter">
            <Zap className="w-5 h-5 text-blue-600" />
            Electricity Units Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className={`text-3xl font-bold ${getUnitsColor()} font-inter`}>
                {unitsRemaining.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 font-inter">Units Remaining (kWh)</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-700 font-inter">
                {estimatedDaysLeft}
              </div>
              <div className="text-sm text-gray-600 font-inter">Days Left</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-700 font-inter">
                ₦{currentUnitRate}
              </div>
              <div className="text-sm text-gray-600 font-inter">Per kWh</div>
            </div>
          </div>
          
          {unitsRemaining < 50 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <Battery className="w-4 h-4" />
                <span className="font-medium font-inter">Low Units Warning</span>
              </div>
              <p className="text-sm text-red-700 font-inter mt-1">
                You have {unitsRemaining.toFixed(1)} kWh left. Consider recharging soon to avoid power interruption.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Recharge */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-inter">
            <Plus className="w-5 h-5 text-blue-600" />
            Quick Recharge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1000, 2000, 5000, 10000].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                onClick={() => setNewRecharge(prev => ({ ...prev, amount: amount.toString() }))}
                className="h-auto p-2 flex flex-col gap-1 font-inter"
              >
                <span className="font-bold">₦{amount.toLocaleString()}</span>
                <span className="text-xs text-gray-500">{currentUnitRate > 0 ? (amount / currentUnitRate).toFixed(1) : '0.0'} kWh</span>
              </Button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 font-inter">Custom Amount (₦)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={newRecharge.amount}
                onChange={(e) => setNewRecharge(prev => ({ ...prev, amount: e.target.value }))}
                className="mt-1 font-inter"
              />
              {newRecharge.amount && currentUnitRate > 0 && (
                <p className="text-xs text-gray-500 mt-1 font-inter">
                  = {(parseFloat(newRecharge.amount) / currentUnitRate).toFixed(2)} kWh units
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 font-inter">Payment Method</Label>
              <select
                value={newRecharge.method}
                onChange={(e) => setNewRecharge(prev => ({ ...prev, method: e.target.value }))}
                className="w-full mt-1 p-2 border border-gray-300 rounded-lg font-inter"
              >
                <option value="card">Debit/Credit Card</option>
                <option value="transfer">Bank Transfer</option>
                <option value="ussd">USSD</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={handleAddRecharge}
              disabled={!newRecharge.amount}
              className="flex-1 bg-blue-600 hover:bg-blue-700 font-inter"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Buy Units
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 font-inter"
            >
              <Scan className="w-4 h-4" />
              Scan Card
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recharge History */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-inter">
            <Receipt className="w-5 h-5 text-purple-600" />
            Recharge History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rechargeHistory.map((recharge) => (
              <div key={recharge.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium font-inter">₦{recharge.amount.toLocaleString()}</div>
                    <div className="text-sm text-gray-500 font-inter">
                      {new Date(recharge.date).toLocaleDateString()} • {recharge.method} • {recharge.units} kWh
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    Units: {recharge.units.toFixed(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Insights */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-inter">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            Usage Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="font-medium text-orange-800 font-inter">Usage Pattern</span>
              </div>
              <p className="text-sm text-orange-700 font-inter">
                You typically use {data.daily_usage?.toFixed(1) || '0.0'} kWh daily. 
                At this rate, your units will last {estimatedDaysLeft} days.
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800 font-inter">Cost Optimization</span>
              </div>
              <p className="text-sm text-blue-700 font-inter">
                Using more solar power during peak hours could extend your units by up to 15%.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-700 font-inter">
                  ₦{getTotalRecharges().toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 font-inter">Total Recharged</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-700 font-inter">
                  {rechargeHistory.length}
                </div>
                <div className="text-sm text-gray-600 font-inter">Transactions</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}