#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || "";
const PUBLIC_DIR = path.join(__dirname, "..", "public", "images");

// Ensure public/images directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

const prompts = [
  {
    name: "hero-shield",
    prompt:
      "modern glowing shield protecting digital assets, blue and purple neon gradient, cryptocurrency security, clean minimalist design, professional illustration, high quality, 8k",
  },
  {
    name: "transaction-flow",
    prompt:
      "smooth flowing transaction data visualization, blockchain nodes connecting, green checkmarks, modern tech aesthetic, abstract clean design, neon highlights, 8k",
  },
  {
    name: "community-network",
    prompt:
      "interconnected community nodes glowing, people helping each other, collaborative network diagram, warm gold and green colors, decentralized network, 8k",
  },
  {
    name: "wallet-protection",
    prompt:
      "digital wallet surrounded by protective barriers, security features glowing, blue and silver color scheme, clean modern design, cryptocurrency protection, 8k",
  },
  {
    name: "threat-detection",
    prompt:
      "warning system detecting threats, red alert visualization, security scanner, digital security concept, modern tech style, clean design, 8k",
  },
];

async function generateImage(name, prompt) {
  try {
    console.log(`\n🎨 Generating ${name}...`);

    // Start the prediction
    const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version:
          "3b0d6256e30c3e86fc01b951f5c7025c9ff4a99434e5e1b4c9d8c6e9b7f5e4d3",
        input: {
          prompt: prompt,
          negative_prompt: "low quality, blur, distorted",
          width: 1024,
          height: 768,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 50,
        },
      }),
    });

    const prediction = await startResponse.json();
    
    if (!prediction.id) {
      console.error(`❌ No prediction ID returned:`, prediction);
      return;
    }
    
    const predictionId = prediction.id;
    console.log(`Prediction ID: ${predictionId}`);

    // Poll for completion
    let completed = false;
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes with 5-second intervals

    while (!completed && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            Authorization: `Token ${REPLICATE_API_TOKEN}`,
          },
        }
      );

      const status = await statusResponse.json();

      if (status.status === "succeeded") {
        completed = true;
        const imageUrl = status.output?.[0];
        
        if (!imageUrl) {
          console.error(`❌ No image URL in output for ${name}`);
          return;
        }

        // Download the image
        console.log(`⬇️ Downloading image...`);
        const imageResponse = await fetch(imageUrl);
        const buffer = await imageResponse.arrayBuffer();

        // Save to public folder
        const filename = path.join(PUBLIC_DIR, `${name}.png`);
        fs.writeFileSync(filename, Buffer.from(buffer));
        console.log(`✅ Saved ${name} (${(buffer.byteLength / 1024).toFixed(1)}KB)`);
      } else if (status.status === "failed") {
        console.error(`❌ Generation failed for ${name}`);
        console.error(`Error: ${status.error}`);
        completed = true;
      } else {
        process.stdout.write(`.`);
      }

      attempts++;
    }

    if (!completed) {
      console.error(`\n❌ Timeout waiting for ${name}`);
    }
  } catch (error) {
    console.error(`\n❌ Error generating ${name}:`, error.message);
  }
}

async function main() {
  console.log("🚀 Starting GENESIS image generation with Replicate...\n");

  for (const { name, prompt } of prompts) {
    await generateImage(name, prompt);
  }

  console.log("\n\n✅ Image generation complete!");
  console.log(`📁 Images saved to: ${PUBLIC_DIR}`);
}

main().catch(console.error);

