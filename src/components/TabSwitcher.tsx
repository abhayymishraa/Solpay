import { TabsContent } from "@radix-ui/react-tabs";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import Airdrop from "./Airdrop";
import Transfer from "./Transfer";
import Transaction from "./Transaction";
import CreateToken from "./CreateToken";

export default function TabSwitcher() {
  return (
    <div className="w-full flex justify-center items-center min-h-screen">
      <Tabs defaultValue="transfer" className="w-[1000px] ">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transfer">Transfer Solana</TabsTrigger>
          <TabsTrigger value="create-token">Create Token</TabsTrigger>
          <TabsTrigger value="airdrop">Airdrop</TabsTrigger>
          <TabsTrigger value="transaction">Transaction</TabsTrigger>
        </TabsList>
        <TabsContent value="transfer">
          <Transfer />
        </TabsContent>
        <TabsContent value="airdrop">
          <Airdrop />
        </TabsContent>
        <TabsContent value="transaction">
          <Transaction />
        </TabsContent>
        <TabsContent value="create-token">
          <CreateToken />
        </TabsContent>
      </Tabs>
    </div>
  );
}
