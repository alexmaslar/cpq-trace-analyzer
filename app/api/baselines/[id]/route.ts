/**
 * Baseline Detail API Routes
 * GET /api/baselines/[id] - Get specific baseline
 * DELETE /api/baselines/[id] - Delete baseline
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { ParsedTrace } from '@/lib/trace-parser';

// GET /api/baselines/[id] - Get specific baseline
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user session
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Fetch baseline with trace data
    const { data: baseline, error } = await supabaseAdmin
      .from('baselines')
      .select(`
        id,
        name,
        filename,
        selection_path,
        created_at,
        trace_id,
        traces!inner (
          raw_content,
          parsed_data
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Baseline not found' }, { status: 404 });
      }
      console.error('Error fetching baseline:', error);
      return NextResponse.json({ error: 'Failed to fetch baseline' }, { status: 500 });
    }

    // Transform to BaselineTrace format
    const formattedBaseline = {
      id: baseline.id,
      name: baseline.name,
      filename: baseline.filename,
      selectionPath: baseline.selection_path,
      createdAt: new Date(baseline.created_at).getTime(),
      rawContent: baseline.traces.raw_content,
      trace: baseline.traces.parsed_data as ParsedTrace,
    };

    return NextResponse.json(formattedBaseline);
  } catch (error) {
    console.error('Unexpected error in GET /api/baselines/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/baselines/[id] - Delete baseline
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user session
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get baseline to find associated trace
    const { data: baseline, error: fetchError } = await supabaseAdmin
      .from('baselines')
      .select('trace_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Baseline not found' }, { status: 404 });
      }
      console.error('Error fetching baseline:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch baseline' }, { status: 500 });
    }

    // Delete baseline (will cascade delete trace due to foreign key constraint)
    const { error: deleteError } = await supabaseAdmin
      .from('baselines')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting baseline:', deleteError);
      return NextResponse.json({ error: 'Failed to delete baseline' }, { status: 500 });
    }

    // Delete associated trace
    await supabaseAdmin
      .from('traces')
      .delete()
      .eq('id', baseline.trace_id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/baselines/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
