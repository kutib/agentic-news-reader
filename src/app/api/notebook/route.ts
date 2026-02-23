import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const savedResearch = await prisma.savedResearch.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(savedResearch);
    } catch (error) {
        console.error('Failed to get notebook items:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve notebook items.' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title, content, sources, taskId } = body;

        if (!title || !content) {
            return NextResponse.json(
                { error: 'Title and content are required' },
                { status: 400 }
            );
        }

        const savedItem = await prisma.savedResearch.create({
            data: {
                title,
                content,
                sources: sources || null,
                taskId: taskId || null,
            },
        });

        return NextResponse.json(savedItem);
    } catch (error) {
        console.error('Failed to save to notebook:', error);
        return NextResponse.json(
            { error: 'Failed to save research.' },
            { status: 500 }
        );
    }
}
