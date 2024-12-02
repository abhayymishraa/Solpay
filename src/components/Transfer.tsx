"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Transaction, SystemProgram, Connection, PublicKey } from "@solana/web3.js";
import { useState } from "react";
import { Coins } from 'lucide-react';
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
import { DEVNET_URL, MAINNET_URL } from "../lib/config";

export default function Transfer() {
  const { publicKey, sendTransaction } = useWallet();
  const [toPublicKey, setToPublicKey] = useState("");
  const [amount, setAmount] = useState(1); // Default 1 SOL
  const [network, setNetwork] = useState("devnet");
  
  // Network configurations
  const networks = {
    devnet: DEVNET_URL,
    mainnet: MAINNET_URL,
  };

  const connection = new Connection(networks[network as keyof typeof networks], "confirmed");

  const handleTransfer = async () => {
    if (!publicKey) {
      toast({
        variant: "destructive",
        title: "Wallet not connected",
        description: "Please connect your wallet first",
      });
      return;
    }

    try {
      const recipient = new PublicKey(toPublicKey);
      const lamports = amount * 1000000000; // Convert SOL to lamports

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipient,
          lamports,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      
      toast({
        title: "Transaction sent",
        description: `Signature: ${signature.slice(0, 8)}...${signature.slice(-8)}`,
      });

      await connection.getSignatureStatus(signature);
      
    toast({
      title: "Transaction confirmed ✅",
      description: "Transfer completed successfully",
    });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Transaction failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }finally{
      setToPublicKey("");
      setAmount(1);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-end mb-4">
        <Select
          value={network}
          onValueChange={setNetwork}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="devnet">Devnet</SelectItem>
            <SelectItem value="mainnet">Mainnet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Transfer SOL
          </CardTitle>
          <CardDescription>
            Send SOL tokens to another wallet address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <WalletMultiButton />
          </div>
          
          <Input
            type="text"
            placeholder="Recipient's Public Key"
            value={toPublicKey}
            onChange={(e) => setToPublicKey(e.target.value)}
          />
          
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="Amount in SOL"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={0}
              step={0.1}
            />
            <p className="text-sm text-gray-500">
              Network: {network.charAt(0).toUpperCase() + network.slice(1)}
            </p>
          </div>

          <Button
            className="w-full"
            onClick={handleTransfer}
            disabled={!publicKey || !toPublicKey || amount <= 0}
          >
            Transfer SOL
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

