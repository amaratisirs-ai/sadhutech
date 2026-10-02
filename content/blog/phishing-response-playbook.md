---
title: "You Clicked a Suspicious Wallet Link. What Should You Do Next?"
description: "A practical response checklist for suspicious sites, approvals, and exposed seed phrases, with different steps for each kind of incident."
slug: "phishing-response-playbook"
pubDate: "2026-10-02"
author: "GENESIS"
tags: ["research", "phishing", "incident-response"]
draft: false
---

A suspicious link is stressful, but the right next step depends on what happened. Simply
opening a page is different from signing a transaction or giving away your recovery
phrase. Pause before clicking any "emergency recovery" ad or answering a direct message.

## If you only opened the page

Close it. Do not download its software or enter a password, recovery phrase, or code.
Return to the service by typing its known address yourself or using a bookmark you
created earlier. If you downloaded a file, do not run it; follow your device's malware
response guidance and update your browser and operating system.

## If you connected or signed

Connecting a wallet alone is not the same as granting spending permission, but you
should review the wallet's recent activity. Look up the transaction on a block explorer
and check whether you approved a token spender or NFT operator. If so, use a trusted
approval manager to revoke unwanted permissions. Also review any typed-data signatures
you issued: some off-chain signatures can be used later. Revoke on-chain permissions
where possible, and consider moving valuable assets to a fresh wallet if you cannot
establish what you authorized.

## If you shared a seed phrase or private key

Treat that wallet as permanently compromised. From a clean device, create a **new wallet
with a new recovery phrase**. Move remaining assets promptly, taking care to pay any
necessary network fees, and stop using the old wallet. Do not import the exposed phrase
into a new app and assume it becomes safe. Changing a site password or revoking token
allowances cannot make a disclosed private key private again.

Keep the site URL, transaction hashes, and any messages as evidence. Report the page to
the impersonated service and the relevant platform. Never send a seed phrase to anyone
claiming they can recover stolen funds. CISA's Secure Our World phishing guidance is a
useful starting point for recognizing and reporting suspicious messages.