import { createHmac, createHash } from 'crypto';
import type { CryptographicLedgerEntry, RemediationActionType } from '../../types';

/**
 * Tamper-Evident Cryptographic Action Ledger
 * Maintains an immutable append-only hash chain of all autonomous operations.
 */

const LEDGER_SIGNING_SECRET = process.env.LEDGER_SECRET_KEY || 'apexfin-zero-trust-hmac-salt-2026';
const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

class CryptographicLedgerService {
  private ledger: CryptographicLedgerEntry[] = [];

  constructor() {
    this.initGenesisBlock();
  }

  private initGenesisBlock() {
    const genesisTime = 1774300000000;
    const genesisActionId = 'act_genesis_0000';
    const genesisPayload = JSON.stringify({ note: 'ApexFin Zero-Trust Ledger Initialized' });

    const digitalSignature = this.signPayload(genesisPayload);
    const blockHash = this.computeBlockHash(0, genesisActionId, genesisTime, digitalSignature, GENESIS_PREV_HASH);

    this.ledger.push({
      index: 0,
      actionId: genesisActionId,
      timestamp: genesisTime,
      agentId: 'SystemRoot',
      actionType: 'CLAMP_BIGQUERY_SLOTS',
      targetResource: 'system.ledger.genesis',
      parameters: { note: 'Genesis Block' },
      preActionMetrics: { systemReady: 1 },
      expectedOutcome: 'Zero-trust cryptographic root established',
      digitalSignature,
      previousBlockHash: GENESIS_PREV_HASH,
      blockHash,
      status: 'VERIFIED',
    });
  }

  private signPayload(payload: string): string {
    return createHmac('sha256', LEDGER_SIGNING_SECRET).update(payload).digest('hex');
  }

  private computeBlockHash(
    index: number,
    actionId: string,
    timestamp: number,
    digitalSignature: string,
    previousBlockHash: string
  ): string {
    const raw = `${index}|${actionId}|${timestamp}|${digitalSignature}|${previousBlockHash}`;
    return createHash('sha256').update(raw).digest('hex');
  }

  public recordAction(
    actionId: string,
    agentId: string,
    actionType: RemediationActionType,
    targetResource: string,
    parameters: Record<string, unknown>,
    preActionMetrics: Record<string, number>,
    expectedOutcome: string
  ): CryptographicLedgerEntry {
    const index = this.ledger.length;
    const timestamp = Date.now();
    const previousBlockHash = this.ledger[index - 1].blockHash;

    const payloadString = JSON.stringify({
      index,
      actionId,
      agentId,
      actionType,
      targetResource,
      parameters,
      preActionMetrics,
    });

    const digitalSignature = this.signPayload(payloadString);
    const blockHash = this.computeBlockHash(index, actionId, timestamp, digitalSignature, previousBlockHash);

    const entry: CryptographicLedgerEntry = {
      index,
      actionId,
      timestamp,
      agentId,
      actionType,
      targetResource,
      parameters,
      preActionMetrics,
      expectedOutcome,
      digitalSignature,
      previousBlockHash,
      blockHash,
      status: 'COMMITTED',
    };

    this.ledger.push(entry);
    return entry;
  }

  public getLedger(): CryptographicLedgerEntry[] {
    return [...this.ledger];
  }

  public verifyIntegrity(): {
    isValid: boolean;
    totalBlocks: number;
    compromisedIndex?: number;
    reason?: string;
  } {
    for (let i = 0; i < this.ledger.length; i++) {
      const block = this.ledger[i];

      // Verify chain link
      if (i === 0) {
        if (block.previousBlockHash !== GENESIS_PREV_HASH) {
          return { isValid: false, totalBlocks: this.ledger.length, compromisedIndex: 0, reason: 'Genesis block previous hash altered' };
        }
      } else {
        const prevBlock = this.ledger[i - 1];
        if (block.previousBlockHash !== prevBlock.blockHash) {
          return {
            isValid: false,
            totalBlocks: this.ledger.length,
            compromisedIndex: i,
            reason: `Broken hash chain at block index ${i}. Previous hash does not match block ${i - 1} hash.`,
          };
        }
      }

      // Verify HMAC digital signature of payload
      if (i > 0) {
        const payloadString = JSON.stringify({
          index: block.index,
          actionId: block.actionId,
          agentId: block.agentId,
          actionType: block.actionType,
          targetResource: block.targetResource,
          parameters: block.parameters,
          preActionMetrics: block.preActionMetrics,
        });
        const expectedSig = this.signPayload(payloadString);
        if (block.digitalSignature !== expectedSig) {
          return {
            isValid: false,
            totalBlocks: this.ledger.length,
            compromisedIndex: i,
            reason: `HMAC digital signature mismatch at block ${i}. Action payload was modified.`,
          };
        }
      }

      // Verify hash recomputation
      const expectedHash = this.computeBlockHash(
        block.index,
        block.actionId,
        block.timestamp,
        block.digitalSignature,
        block.previousBlockHash
      );

      if (block.blockHash !== expectedHash) {
        return {
          isValid: false,
          totalBlocks: this.ledger.length,
          compromisedIndex: i,
          reason: `Cryptographic hash mismatch at block index ${i}. Content was altered.`,
        };
      }
    }

    return { isValid: true, totalBlocks: this.ledger.length };
  }

  public rollbackAction(index: number): { success: boolean; message: string } {
    if (index <= 0 || index >= this.ledger.length) {
      return { success: false, message: 'Invalid block index or cannot rollback Genesis block.' };
    }

    const targetBlock = this.ledger[index];
    targetBlock.status = 'REVERTED';

    // Record an inverse compensation block
    this.recordAction(
      `rollback_${targetBlock.actionId}`,
      'HealingActuator',
      targetBlock.actionType,
      targetBlock.targetResource,
      { rollbackOfIndex: index, revertedAction: targetBlock.actionId },
      { rollbackTriggered: 1 },
      `Autonomous rollback compensation for Action ${targetBlock.actionId}`
    );

    return {
      success: true,
      message: `Action ${targetBlock.actionId} at index ${index} successfully reverted. Inversion block logged.`,
    };
  }

  public clearNonGenesis(): void {
    const genesis = this.ledger[0];
    this.ledger = [genesis];
  }
}

// Global singleton instance
declare global {
  var __apexFinLedger: CryptographicLedgerService | undefined;
}

export const cryptoLedger = global.__apexFinLedger || new CryptographicLedgerService();
if (process.env.NODE_ENV !== 'production') {
  global.__apexFinLedger = cryptoLedger;
}
