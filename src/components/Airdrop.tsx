"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey } from "@solana/web3.js";
import { useState } from "react";
import { Coins } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "../hooks/use-toast";
import { DEVNET_URL } from "../lib/config";

export default function Component() {
  const [amount, setAmount] = useState(0);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [selected, setSelected] = useState<string | null>("wallet");
  const wallet = useWallet();
  const customUrl = DEVNET_URL;
  const connection = new Connection(customUrl, "confirmed");

  const handleAirdrop = async (amount: number) => {
    const targetPublicKey =
      selected === "wallet" ? wallet.publicKey : publicKey;
    if (!targetPublicKey) return;
    const clampedAmount = Math.min(amount, 2); // Ensure maximum of 2 SOL
    try {
      const signature = await connection.requestAirdrop(
        targetPublicKey,
        clampedAmount * 1000000000
      );
      await connection.getSignatureStatus(signature);
      toast({
        title: `Airdrop of ${clampedAmount} SOL successful!`,
        description: "Amount is credited in the given Address",
      });
    } catch (error) {
      console.error("Airdrop failed:", error);
      toast({
        variant: "destructive",
        title: `Airdrop of ${clampedAmount} SOL failed!`,
        description: "Please try again later or check the address again",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className={`flex justify-end mb-4`}>
        <Select onValueChange={(value) => setSelected(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={selected} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="wallet">Connected Wallet</SelectItem>
            <SelectItem value="externalAddress">External Address</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selected && (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Request Airdrop
            </CardTitle>
            <CardDescription>
              Request SOL tokens to be airdropped to{" "}
              {selected === "wallet" ? "your wallet" : "an external address"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected === "wallet" && (
              <div className="flex justify-center">
                <WalletMultiButton />
              </div>
            )}
            {selected === "externalAddress" && (
              <Input
                type="text"
                placeholder="Public Key"
                onChange={(e) => {
                  try {
                    setPublicKey(new PublicKey(e.target.value));
                  } catch (error) {
                    console.log(error);
                    setPublicKey(null);
                  }
                }}
              />
            )}
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Amount in SOL (max 2)"
                onChange={(e) => setAmount(Math.min(Number(e.target.value), 2))}
                value={amount === 0 ? "" : amount}
                min={0}
                max={2}
                step={0.1}
              />
              <p className="text-sm text-gray-500">
                Maximum airdrop amount: 2 SOL
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => handleAirdrop(amount)}
              disabled={
                (selected === "wallet" && !wallet.publicKey) ||
                (selected === "externalAddress" && !publicKey) ||
                amount <= 0
              }
            >
              Request Airdrop
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
