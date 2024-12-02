"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { 
  Connection, 
  ConfirmedSignatureInfo, 
  ParsedTransactionWithMeta,
  PublicKey 
} from "@solana/web3.js";
import { useState, useEffect } from "react";
import { Coins, ChevronLeft, ChevronRight, Clock, Database, Receipt } from 'lucide-react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "../hooks/use-toast";
import { cn } from "../lib/utils";
import { DEVNET_URL, MAINNET_URL } from "../lib/config";

interface TransactionDetails {
  signature: string;
  parsedData: ParsedTransactionWithMeta | null;
  loading: boolean;
}

export default function TransactionHistory() {
  const { publicKey } = useWallet();
  const [transactions, setTransactions] = useState<ConfirmedSignatureInfo[]>([]);
  const [selectedTx, setSelectedTx] = useState<TransactionDetails | null>(null);
  const [network, setNetwork] = useState("devnet");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [externalAddress, setExternalAddress] = useState("");
  const transactionsPerPage = 10;

  const networks = {
    devnet: DEVNET_URL,
    mainnet: MAINNET_URL,
  };

  const connection = new Connection(
    networks[network as keyof typeof networks],
    "confirmed"
  );

  const getTransactions = async () => {
    if (!publicKey && !externalAddress) {
      toast({
        variant: "destructive",
        title: "No address provided",
        description: "Please connect your wallet or enter an external address",
      });
      return;
    }

    setLoading(true);
    try {
      const address = externalAddress ? new PublicKey(externalAddress) : publicKey;
      if(!address) return;
      const signatures = await connection.getSignaturesForAddress(address, {
        limit: 100,
      });
      setTransactions(signatures.map(sig => ({
        ...sig,
        blockTime: sig.blockTime ?? 0
      })));
      setCurrentPage(1);
      toast({
        title: "Transactions fetched",
        description: `Retrieved ${signatures.length} transactions for ${externalAddress ? 'external address' : 'connected wallet'}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch transactions",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTransactionDetails = async (signature: string) => {
    setSelectedTx({ signature, parsedData: null, loading: true });
    try {
      const tx = await connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });
      setSelectedTx({ 
        signature, 
        parsedData: tx ?? null,
        loading: false 
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch transaction details",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
      setSelectedTx(null);
    }
  };

  useEffect(() => {
    if (publicKey || externalAddress) {
      getTransactions();
    }
  }, [publicKey, network, externalAddress]);

  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const formatAmount = (lamports: number) => {
    return (lamports / 1e9).toFixed(9);
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Transaction History</h1>
        <Select value={network} onValueChange={setNetwork}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="devnet">Devnet</SelectItem>
            <SelectItem value="mainnet">Mainnet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Solana Transactions
          </CardTitle>
          <CardDescription>
            View your recent Solana transactions on {network}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-4">
            <WalletMultiButton className="bg-[#6C5DD3] hover:bg-[#5b4eb8] text-white" />
          </div>
          <Input
            type="text"
            placeholder="Enter external public address (optional)"
            value={externalAddress}
            onChange={(e) => setExternalAddress(e.target.value)}
            className="mb-4"
          />
          <Button
            onClick={getTransactions}
            disabled={loading || (!publicKey && !externalAddress)}
            className="w-full mb-4 bg-black hover:bg-black/90"
          >
            {loading ? "Fetching..." : "Refresh Transactions"}
          </Button>

          {currentTransactions.length > 0 ? (
            <>
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead>Signature</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Block Time</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTransactions.map((tx, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">
                        {shortenAddress(tx.signature)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={tx.err ? "destructive" : "default"}
                          className={cn(
                            "capitalize",
                            tx.err ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                          )}
                        >
                          {tx.err ? "Failed" : "Success"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell>{tx.slot}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-[#6C5DD3]/10"
                              onClick={() => getTransactionDetails(tx.signature)}
                            >
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Transaction Details</DialogTitle>
                              <DialogDescription>
                                Detailed information about this transaction
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="h-[600px] pr-4">
                              {selectedTx?.loading ? (
                                <div className="flex items-center justify-center p-4">
                                  Loading transaction details...
                                </div>
                              ) : selectedTx?.parsedData ? (
                                <div className="space-y-4">
                                  <Accordion type="single" collapsible>
                                    <AccordionItem value="overview">
                                      <AccordionTrigger>
                                        <div className="flex items-center gap-2">
                                          <Receipt className="h-4 w-4" />
                                          Overview
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <div className="space-y-2">
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                              Signature: {"   "}
                                            </span>
                                            <span className="font-mono">
                                              {selectedTx.signature}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                              Slot
                                            </span>
                                            <span>
                                              {selectedTx.parsedData.slot}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                              Fee
                                            </span>
                                            <span>
                                              {formatAmount(selectedTx.parsedData?.meta?.fee ?? 0)} SOL
                                            </span>
                                          </div>
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="accounts">
                                      <AccordionTrigger>
                                        <div className="flex items-center gap-2">
                                          <Database className="h-4 w-4" />
                                          Account Inputs
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Address</TableHead>
                                              <TableHead>Change</TableHead>
                                              <TableHead>Post Balance</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {selectedTx.parsedData?.meta?.postBalances.map(
                                              (balance, index) => {
                                                const preBalance =
                                                  selectedTx.parsedData?.meta?.preBalances[index] ?? 0;
                                                const change =
                                                  balance - preBalance;
                                                const address = selectedTx.parsedData?.transaction.message.accountKeys[index]?.pubkey.toString() ?? '';
                                                return (
                                                  <TableRow key={index}>
                                                    <TableCell className="font-mono">
                                                      {shortenAddress(address)}
                                                    </TableCell>
                                                    <TableCell
                                                      className={
                                                        change > 0
                                                          ? "text-green-500"
                                                          : change < 0
                                                          ? "text-red-500"
                                                          : ""
                                                      }
                                                    >
                                                      {change !== 0 &&
                                                        (change > 0 ? "+" : "") +
                                                          formatAmount(change)}{" "}
                                                      SOL
                                                    </TableCell>
                                                    <TableCell>
                                                      {formatAmount(balance)} SOL
                                                    </TableCell>
                                                  </TableRow>
                                                );
                                              }
                                            )}
                                          </TableBody>
                                        </Table>
                                      </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="logs">
                                      <AccordionTrigger>
                                        <div className="flex items-center gap-2">
                                          <Clock className="h-4 w-4" />
                                          Program Logs
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                                          {selectedTx.parsedData?.meta?.logMessages?.join("\n") ?? "No logs available"}
                                        </pre>
                                      </AccordionContent>
                                    </AccordionItem>
                                  </Accordion>
                                </div>
                              ) : (
                                <div className="text-center p-4">
                                  No transaction details available
                                </div>
                              )}
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center mt-4">
                <Button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <span>
                  Page {currentPage} of{" "}
                  {Math.ceil(transactions.length / transactionsPerPage)}
                </span>
                <Button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={indexOfLastTransaction >= transactions.length}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </>
          ) : (
            <p className="text-center">
              No transactions found. Connect your wallet and click "Refresh
              Transactions" to view your transaction history.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

