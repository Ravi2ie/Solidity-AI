import { GoogleGenAI } from "@google/genai";
import { getReward, getModelIdentifier } from './modelRouter';

const ai = new GoogleGenAI({
  apiKey: getReward(),
});

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export interface AIGenerationOptions {
  commentStyle: 'natspec' | 'inline' | 'both';
  includeParamDocs: boolean;
  includeReturnDocs: boolean;
  includeDevNotes: boolean;
}

// Helper function to check if error is a quota/rate limit error
const isQuotaError = (error: unknown): boolean => {
  const errorObj = error as Record<string, unknown>;
  const errorStr = JSON.stringify(error);
  return (
    errorObj?.status === 'RESOURCE_EXHAUSTED' ||
    errorObj?.code === 429 ||
    errorStr.includes('quota') ||
    errorStr.includes('Quota exceeded') ||
    errorStr.includes('RESOURCE_EXHAUSTED')
  );
};

// Helper function to extract retry delay from error
const getRetryDelayFromError = (error: unknown): number | null => {
  try {
    const errorObj = error as Record<string, unknown>;
    if (errorObj?.details && Array.isArray(errorObj.details)) {
      for (const detail of errorObj.details) {
        const detailObj = detail as Record<string, unknown>;
        if (typeof detailObj['@type'] === 'string' && detailObj['@type'].includes('RetryInfo') && detailObj.retryDelay) {
          const match = String(detailObj.retryDelay).match(/(\d+)/);
          if (match) {
            return parseInt(match[1]) * 1000;
          }
        }
      }
    }
  } catch (e) {
    // Fallback to default delay
  }
  return null;
};

// Helper function to remove markdown code block markers
const cleanCodeResponse = (text: string): string => {
  // Remove ```solidity and ``` markers
  return text
    .replace(/^```(?:solidity|sol|javascript|typescript)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
};

// Wrapper function with retry logic
const withRetry = async <T>(
  fn: () => Promise<T>,
  operationName: string
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isQuota = isQuotaError(error);

      if (isQuota) {
        const retryDelay = getRetryDelayFromError(error?.response?.data?.error);
        const delayMs = retryDelay || INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);

        if (attempt < MAX_RETRIES) {
          console.warn(
            `${operationName} quota exceeded. Retrying in ${(delayMs / 1000).toFixed(1)}s (attempt ${attempt}/${MAX_RETRIES})...`
          );
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        } else {
          throw new Error(
            'API quota exceeded. Please check your usage or upgrade to a paid plan.'
          );
        }
      }

      // For non-quota errors, throw immediately
      throw error;
    }
  }

  throw lastError;
};

export const generateSolidityComments = async (
  code: string,
  options: AIGenerationOptions
): Promise<string> => {
  try {
    return await withRetry(async () => {
      const styleInstructions = {
        natspec: 'Generate NatSpec-style documentation (/** @notice ... */) for Solidity code.',
        inline: 'Generate inline comments (// ...) for Solidity code.',
        both: 'Generate both NatSpec documentation and inline comments for Solidity code.',
      };

      const docOptions = [];
      if (options.includeParamDocs) docOptions.push('@param documentation');
      if (options.includeReturnDocs) docOptions.push('@return documentation');
      if (options.includeDevNotes) docOptions.push('@dev notes');

      const additionalInstructions = docOptions.length > 0
        ? `Include ${docOptions.join(', ')}.`
        : '';

      const prompt = `You are an expert Solidity smart contract developer. ${styleInstructions[options.commentStyle]} ${additionalInstructions}

Analyze the following Solidity code and generate comprehensive documentation comments:

\`\`\`solidity
${code}
\`\`\`

Requirements:
1. Preserve the original code structure and formatting
2. Add comments above functions and important code blocks
3. For NatSpec: Use proper @notice, @param, @return, @dev, @custom tags
4. For inline: Use // comments on separate lines before code blocks
5. Explain what the code does and why
6. Keep comments concise but informative
7. Return only the commented code without any explanations

Output:`;

      const response = await ai.models.generateContent({
        model: getModelIdentifier(),
        contents: prompt,
      });

      return cleanCodeResponse(response.text);
    }, 'Generate comments');
  } catch (error) {
    console.error('Error generating comments:', error);
    if (error instanceof Error && error.message.includes('quota')) {
      throw error;
    }
    throw new Error('Failed to generate comments. Please check your reward token and try again.');
  }
};

export const generateSolidityCode = async (
  description: string
): Promise<string> => {
  try {
    return await withRetry(async () => {
      const prompt = `You are an expert Solidity smart contract developer. Generate a complete, production-ready Solidity contract based on the following description:

${description}

Requirements:
1. Use Solidity ^0.8.19 or higher
2. Include proper SPDX license identifier (MIT)
3. Add comprehensive NatSpec documentation
4. Include error handling and validation
5. Follow Solidity best practices and security guidelines
6. Return only the code without any explanations

Output:`;

      const response = await ai.models.generateContent({
        model: getModelIdentifier(),
        contents: prompt,
      });

      return cleanCodeResponse(response.text);
    }, 'Generate code');
  } catch (error) {
    console.error('Error generating code:', error);
    if (error instanceof Error && error.message.includes('quota')) {
      throw error;
    }
    throw new Error('Failed to generate code. Please check your reward token and try again.');
  }
};

export const analyzeSolidityCode = async (
  code: string
): Promise<string> => {
  try {
    return await withRetry(async () => {
      const prompt = `You are an expert Solidity smart contract auditor. Analyze the following Solidity code for:
1. Security vulnerabilities
2. Gas optimization opportunities
3. Best practice violations
4. Code quality improvements

\`\`\`solidity
${code}
\`\`\`

Provide a structured analysis with clear sections for each concern found. Be specific and actionable in your recommendations.`;

      const response = await ai.models.generateContent({
        model: getModelIdentifier(),
        contents: prompt,
      });

      return response.text;
    }, 'Analyze code');
  } catch (error) {
    console.error('Error analyzing code:', error);
    if (error instanceof Error && error.message.includes('quota')) {
      throw error;
    }
    throw new Error('Failed to analyze code. Please check your reward token and try again.');
  }
};

export const explainSolidityCode = async (
  code: string
): Promise<string> => {
  try {
    return await withRetry(async () => {
      const prompt = `You are an expert Solidity developer. Explain the following Solidity code in clear, simple terms:

\`\`\`solidity
${code}
\`\`\`

Provide:
1. Overall purpose of the contract/function
2. Key variables and their purposes
3. Important functions and their behavior
4. Any security considerations or important notes`;

      const response = await ai.models.generateContent({
        model: getModelIdentifier(),
        contents: prompt,
      });

      return response.text;
    }, 'Explain code');
  } catch (error) {
    console.error('Error explaining code:', error);
    if (error instanceof Error && error.message.includes('quota')) {
      throw error;
    }
    throw new Error('Failed to explain code. Please check your reward token and try again.');
  }
};

export const detectVulnerabilities = async (
  code: string
): Promise<string> => {
  try {
    return await withRetry(async () => {
      const prompt = `You are an expert Solidity security auditor. Analyze the following Solidity code and detect ONLY these three specific vulnerabilities:

\`\`\`solidity
${code}
\`\`\`

ONLY look for and report on these three vulnerability types:
1. **Reentrancy Attacks** - Functions that could be vulnerable to reentrancy (external calls before state changes)
2. **Timestamp Dependency** - Use of block.timestamp in critical logic that depends on timestamp
3. **Infinite Loops** - Unbounded loops that could cause gas exhaustion or infinite execution

IMPORTANT INSTRUCTIONS:
- Do NOT check for any other vulnerabilities (no access control, no overflow/underflow, no front-running, no delegatecall, no unchecked calls)
- Only report if you find one of these three specific issues
- Format your response EXACTLY like this for each vulnerability found:

[VULNERABILITY]
Location: line number or function name
Type: vulnerability type (must be one of: Reentrancy Attacks, Timestamp Dependency, Infinite Loops)
Severity: Critical|High|Medium|Low
Description: detailed explanation of the vulnerability
Fix: recommended solution
Comment: // SECURITY: [Severity] - brief description and fix
---

If no vulnerabilities of these three types are found, respond with:
No vulnerabilities detected in this code.

Be thorough in checking for ONLY these three types of issues.`;

      const response = await ai.models.generateContent({
        model: getModelIdentifier(),
        contents: prompt,
      });

      const responseText = cleanCodeResponse(response.text);
      
      // Check if no vulnerabilities were found
      if (responseText.includes('No vulnerabilities detected') || responseText.length < 20) {
        return 'No vulnerabilities detected!';
      }

      // Split by [VULNERABILITY] markers to get individual vulnerabilities
      const vulnerabilityBlocks = responseText.split('[VULNERABILITY]').filter(block => block.trim());
      
      if (vulnerabilityBlocks.length === 0) {
        return 'No vulnerabilities detected!';
      }

      let formattedOutput = `SECURITY AUDIT REPORT\n`;
      formattedOutput += `Found ${vulnerabilityBlocks.length} potential vulnerability(ies)\n`;
      formattedOutput += `${'='.repeat(60)}\n\n`;

      vulnerabilityBlocks.forEach((block, index) => {
        const lines = block.split('\n').filter(line => line.trim());
        const vulnObj: {
          location?: string;
          type?: string;
          severity?: string;
          description?: string;
          fix?: string;
          comment?: string;
        } = {};

        // Parse each field
        lines.forEach(line => {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            const keyName = key.trim().toLowerCase();
            const value = valueParts.join(':').trim();
            
            if (keyName === 'location') vulnObj.location = value;
            else if (keyName === 'type') vulnObj.type = value;
            else if (keyName === 'severity') vulnObj.severity = value;
            else if (keyName === 'description') vulnObj.description = value;
            else if (keyName === 'fix') vulnObj.fix = value;
            else if (keyName === 'comment') vulnObj.comment = value;
          }
        });

        if (vulnObj.type || vulnObj.location) {
          formattedOutput += `${index + 1}. **${vulnObj.type || 'Unknown Vulnerability'}** [${vulnObj.severity || 'Unknown'}]\n`;
          if (vulnObj.location) formattedOutput += `   Location: ${vulnObj.location}\n`;
          if (vulnObj.description) formattedOutput += `   Issue: ${vulnObj.description}\n`;
          if (vulnObj.fix) formattedOutput += `   Fix: ${vulnObj.fix}\n`;
          if (vulnObj.comment) formattedOutput += `   ${vulnObj.comment}\n`;
          formattedOutput += `\n${'-'.repeat(60)}\n\n`;
        }
      });

      return formattedOutput;
    }, 'Detect vulnerabilities');
  } catch (error) {
    console.error('Error detecting vulnerabilities:', error);
    
    const errorStr = JSON.stringify(error);
    if (errorStr.includes('overloaded') || errorStr.includes('503')) {
      throw new Error('Vulnerability detection service is temporarily overloaded. Please try again in a few moments.');
    }
    
    if (error instanceof Error && error.message.includes('quota')) {
      throw error;
    }
    throw new Error('Failed to detect vulnerabilities. Please check your reward token and try again.');
  }
};
