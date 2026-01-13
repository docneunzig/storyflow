import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

// Check if Claude CLI is authenticated (has history.jsonl from prior use)
export function isClaudeCliAuthenticated(): boolean {
  const historyPath = join(homedir(), '.claude', 'history.jsonl')
  return existsSync(historyPath)
}

// Legacy function for API key check (kept for backwards compatibility)
export function isApiKeyConfigured(): boolean {
  // Now we check for Claude CLI authentication instead
  return isClaudeCliAuthenticated()
}

interface ClaudeCliResponse {
  type: string
  subtype: string
  is_error: boolean
  result: string
  duration_ms: number
  total_cost_usd: number
  usage?: {
    input_tokens: number
    output_tokens: number
  }
}

export interface ClaudeCliResult {
  result: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

// Call Claude CLI with a prompt and return the response
export async function callClaudeCli(prompt: string, systemPrompt?: string): Promise<ClaudeCliResult> {
  return new Promise((resolve, reject) => {
    // Build the command with system prompt if provided
    const args = ['-p', '--output-format', 'json', '--model', 'sonnet']

    if (systemPrompt) {
      args.push('--append-system-prompt', systemPrompt)
    }

    const claude = spawn('claude', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    })

    let stdout = ''
    let stderr = ''

    claude.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    claude.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    claude.on('error', (err) => {
      reject(new Error(`Failed to start Claude CLI: ${err.message}. Make sure 'claude' is in your PATH.`))
    })

    claude.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`))
        return
      }

      try {
        const response: ClaudeCliResponse = JSON.parse(stdout)
        if (response.is_error) {
          reject(new Error(`Claude CLI error: ${response.result}`))
          return
        }
        resolve({
          result: response.result,
          usage: response.usage ? {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
          } : undefined,
        })
      } catch (err) {
        reject(new Error(`Failed to parse Claude CLI response: ${stdout}`))
      }
    })

    // Send the prompt to stdin
    claude.stdin.write(prompt)
    claude.stdin.end()
  })
}
