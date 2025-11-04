import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma";

