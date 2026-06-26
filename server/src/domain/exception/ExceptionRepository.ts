import { Exception } from './Exception.js';

export interface ExceptionRepository {
  findById(id: string): Promise<Exception | null>;
  findAll(): Promise<Exception[]>;
  findOpen(): Promise<Exception[]>;
  save(exception: Exception): Promise<void>;
}
