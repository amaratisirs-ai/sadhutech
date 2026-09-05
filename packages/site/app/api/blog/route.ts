import { NextResponse } from "next/server";
import { listPosts } from "@/src/blog";

export async function GET() {
  return NextResponse.json({ posts: listPosts() });
}
