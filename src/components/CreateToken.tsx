import { useCallback, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { MINT_SIZE, TOKEN_PROGRAM_ID, createInitializeMintInstruction, getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createMintToInstruction } from '@solana/spl-token'
import { createCreateMetadataAccountV3Instruction, PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, } from "./ui/card"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Loader2, Coins } from 'lucide-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { DEVNET_URL, MAINNET_URL } from '../lib/config'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

export default function CreateToken() {
  const { publicKey, sendTransaction } = useWallet()
  const [tokenName, setTokenName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [metadata, setMetadata] = useState('')
  const [amount, setAmount] = useState('')
  const [decimals, setDecimals] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [network, setNetwork] = useState("devnet");

  const networks = {
    devnet: DEVNET_URL,
    mainnet: MAINNET_URL,
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const connection = new Connection(
    networks[network as keyof typeof networks],
    "confirmed"
  );

  const onClick = useCallback(async (form: { tokenName: string; symbol: string; metadata: string; amount: number; decimals: number }) => {
    if (!publicKey) {
      setError('Wallet not connected')
      return
    }

    setIsLoading(true)
    setStatus('')
    setError('')

    try {
      const lamports = await getMinimumBalanceForRentExemptMint(connection);
      const mintKeypair = Keypair.generate();
      const tokenATA = await getAssociatedTokenAddress(mintKeypair.publicKey, publicKey);
      const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
        {
          metadata: PublicKey.findProgramAddressSync(
            [
              Buffer.from("metadata"),
              PROGRAM_ID.toBuffer(),
              mintKeypair.publicKey.toBuffer(),
            ],
            PROGRAM_ID,
          )[0],
          mint: mintKeypair.publicKey,
          mintAuthority: publicKey,
          payer: publicKey,
          updateAuthority: publicKey,
        },
        {
          createMetadataAccountArgsV3: {
            data: {
              name: form.tokenName,
              symbol: form.symbol,
              uri: form.metadata,
              creators: null,
              sellerFeeBasisPoints: 0,
              uses: null,
              collection: null,
            },
            isMutable: false,
            collectionDetails: null,
          },
        },
      )

      const createNewTokenTransaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports: lamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
          mintKeypair.publicKey, 
          form.decimals, 
          publicKey, 
          publicKey, 
          TOKEN_PROGRAM_ID),
        createAssociatedTokenAccountInstruction(
          publicKey,
          tokenATA,
          publicKey,
          mintKeypair.publicKey,
        ),
        createMintToInstruction(
          mintKeypair.publicKey,
          tokenATA,
          publicKey,
          form.amount * Math.pow(10, form.decimals),
        ),
        createMetadataInstruction
      )

      const signature = await sendTransaction(createNewTokenTransaction, connection, {signers: [mintKeypair]})
      
      setStatus(`Token created successfully! Transaction signature: ${signature}`)
    } catch (err) {
      console.error(err)
      setError('Failed to create token. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [publicKey, connection, sendTransaction])

  return (
    <div className="w-full max-w-[520px] mx-auto p-4">
      <div className="flex justify-end mb-4">
        <Select value={network} onValueChange={setNetwork}>
          <SelectTrigger className="w-[120px] bg-white border-black">
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="devnet">Devnet</SelectItem>
            <SelectItem value="mainnet">Mainnet</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card className="bg-white shadow-none border rounded-lg">
        <CardContent className="p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-[#7C3AED] rounded-lg flex items-center justify-center mb-2">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm text-gray-500">Fill in the details to create your custom token</p>
          </div>
          <div className="space-y-4">
            <div className="mb-4 flex justify-center">
              <WalletMultiButton className="w-full !bg-[#7C3AED] hover:!bg-[#6D28D9] !h-10 !rounded-lg !text-sm" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Token Name</Label>
              <Input
                placeholder="My Token"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                className="mt-1 bg-white border-gray-200"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Symbol</Label>
              <Input
                placeholder="MTK"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="mt-1 bg-white border-gray-200"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Metadata URL</Label>
              <Input
                placeholder="https://example.com/token-metadata.json"
                value={metadata}
                onChange={(e) => setMetadata(e.target.value)}
                className="mt-1 bg-white border-gray-200"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Amount</Label>
              <Input
                type="number"
                placeholder="1000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 bg-white border-gray-200"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Decimals</Label>
              <Input
                type="number"
                placeholder="9"
                value={decimals}
                onChange={(e) => setDecimals(e.target.value)}
                className="mt-1 bg-white border-gray-200"
              />
            </div>
            <Button 
              className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-medium h-10 rounded-lg"
              onClick={() => onClick({decimals: Number(decimals), amount: Number(amount), metadata, symbol, tokenName})}
              disabled={isLoading || !publicKey}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Token
                </>
              ) : (
                'Create Token'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      {status && (
        <Alert className="mt-4 border border-green-100 bg-green-50">
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">{status}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mt-4 border border-red-100 bg-red-50">
          <AlertTitle className="text-red-800">Error</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

