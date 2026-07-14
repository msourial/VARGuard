"use client";

import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";
import type { WalletContextState } from "@solana/wallet-adapter-react";

const PROGRAM_ID = new PublicKey("6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J");
const TOKEN_MINT = new PublicKey("4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG");
const IDL = { address: PROGRAM_ID.toBase58(), metadata: { name: "txoracle", version: "1.5.6", spec: "0.1.0" }, instructions: [{ name: "subscribe", discriminator: [254, 28, 191, 138, 156, 179, 183, 53], accounts: [{ name: "user", writable: true, signer: true }, { name: "pricing_matrix" }, { name: "token_mint" }, { name: "user_token_account", writable: true }, { name: "token_treasury_vault", writable: true }, { name: "token_treasury_pda" }, { name: "token_program" }, { name: "system_program" }, { name: "associated_token_program" }], args: [{ name: "service_level_id", type: "u16" }, { name: "weeks", type: "u8" }] }] } as unknown as anchor.Idl;

export async function subscribeToTxLineDevnet(wallet: WalletContextState, connection: Connection) {
  if (!wallet.publicKey || !wallet.signTransaction) throw new Error("Connect a Devnet wallet before activating TxLINE.");
  const provider = new anchor.AnchorProvider(connection, wallet as unknown as anchor.Wallet, { commitment: "confirmed" });
  const program = new anchor.Program(IDL, provider);
  const [treasuryPda] = PublicKey.findProgramAddressSync([Buffer.from("token_treasury_v2")], PROGRAM_ID);
  const [pricingMatrix] = PublicKey.findProgramAddressSync([Buffer.from("pricing_matrix")], PROGRAM_ID);
  const treasuryVault = getAssociatedTokenAddressSync(TOKEN_MINT, treasuryPda, true, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
  const userTokenAccount = getAssociatedTokenAddressSync(TOKEN_MINT, wallet.publicKey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
  const subscribeInstruction = await program.methods.subscribe(1, 4).accounts({ user: wallet.publicKey, pricingMatrix, tokenMint: TOKEN_MINT, userTokenAccount, tokenTreasuryVault: treasuryVault, tokenTreasuryPda: treasuryPda, tokenProgram: TOKEN_2022_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId }).instruction();
  const transaction = new Transaction().add(createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, userTokenAccount, wallet.publicKey, TOKEN_MINT, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID), subscribeInstruction);
  return provider.sendAndConfirm(transaction);
}
