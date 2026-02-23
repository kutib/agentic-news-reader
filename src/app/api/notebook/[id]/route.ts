import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        await prisma.savedResearch.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Failed to delete notebook item:', error);
        return NextResponse.json(
            { error: 'Failed to delete item.' },
            { status: 500 }
        );
    }
}
