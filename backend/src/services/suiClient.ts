import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { fromB64 } from '@mysten/sui.js/utils';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

// Initialize Sui client
const network = (process.env.SUI_NETWORK || 'devnet') as 'devnet' | 'testnet' | 'mainnet';
export const suiClient = new SuiClient({ url: getFullnodeUrl(network) });

// Initialize keypair from private key
let keypair: Ed25519Keypair;

try {
  const privateKeyString = process.env.SUI_PRIVATE_KEY;
  if (!privateKeyString) {
    throw new Error('SUI_PRIVATE_KEY not set in environment');
  }

  // Handle both suiprivkey1... format and base64 format
  if (privateKeyString.startsWith('suiprivkey1')) {
    // Use fromSecretKey with the bech32 encoded key
    keypair = Ed25519Keypair.fromSecretKey(privateKeyString);
  } else {
    // Legacy base64 format
    const privateKeyBytes = fromB64(privateKeyString);
    keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes.slice(1));
  }

  logger.info(`Sui client initialized for ${network}`);
  logger.info(`Address: ${keypair.getPublicKey().toSuiAddress()}`);
} catch (error) {
  logger.error('Failed to initialize Sui keypair:', error);
  throw error;
}

export const getKeypair = () => keypair;

export const PACKAGE_ID = process.env.SUI_PACKAGE_ID || '';

// Helper to execute transaction
export async function executeTransaction(txb: TransactionBlock) {
  try {
    const result = await suiClient.signAndExecuteTransactionBlock({
      transactionBlock: txb,
      signer: keypair,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
      },
    });

    if (result.effects?.status?.status !== 'success') {
      throw new Error(`Transaction failed: ${result.effects?.status?.error}`);
    }

    return result;
  } catch (error) {
    logger.error('Transaction execution failed:', error);
    throw error;
  }
}

// Get owned objects
export async function getOwnedObjects(owner: string, type?: string) {
  try {
    const objects = await suiClient.getOwnedObjects({
      owner,
      filter: type ? { StructType: type } : undefined,
      options: {
        showContent: true,
        showType: true,
      },
    });

    return objects.data;
  } catch (error) {
    logger.error('Failed to fetch owned objects:', error);
    throw error;
  }
}

// Get object details
export async function getObject(objectId: string) {
  try {
    const object = await suiClient.getObject({
      id: objectId,
      options: {
        showContent: true,
        showType: true,
        showOwner: true,
      },
    });

    return object;
  } catch (error) {
    logger.error(`Failed to fetch object ${objectId}:`, error);
    throw error;
  }
}

// Subscribe to events
export async function subscribeToEvents(
  filter: any,
  onEvent: (event: any) => void
) {
  try {
    const unsubscribe = await suiClient.subscribeEvent({
      filter,
      onMessage: onEvent,
    });

    return unsubscribe;
  } catch (error) {
    logger.error('Failed to subscribe to events:', error);
    throw error;
  }
}
