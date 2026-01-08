/**
 * Baselines API Routes
 * POST /api/baselines - Create new baseline
 * GET /api/baselines - List all baselines for current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { ParsedTrace } from '@/lib/trace-parser';
import { extractSelectionPath } from '@/lib/baseline-storage';

// GET /api/baselines - List all baselines for current user
export async function GET(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user session with admin client
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Fetch baselines with trace data
    const { data: baselines, error } = await supabaseAdmin
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
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error || !baselines) {
      console.error('Error fetching baselines:', error);
      return NextResponse.json({ error: 'Failed to fetch baselines' }, { status: 500 });
    }

    // Transform to BaselineTrace format
    const formattedBaselines = baselines.map((baseline: any) => {
      const traceData = Array.isArray(baseline.traces) ? baseline.traces[0] : baseline.traces;
      return {
        id: baseline.id,
        name: baseline.name,
        filename: baseline.filename,
        selectionPath: baseline.selection_path,
        createdAt: new Date(baseline.created_at).getTime(),
        rawContent: traceData.raw_content,
        trace: traceData.parsed_data as ParsedTrace,
      };
    });

    return NextResponse.json(formattedBaselines);
  } catch (error) {
    console.error('Unexpected error in GET /api/baselines:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/baselines - Create new baseline
export async function POST(request: NextRequest) {
  try {
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

    // Parse request body
    const body = await request.json();
    const { name, filename, rawContent, trace } = body as {
      name: string;
      filename: string;
      rawContent: string;
      trace: ParsedTrace;
    };

    // Validate required fields
    if (!name || !filename || !rawContent || !trace) {
      return NextResponse.json(
        { error: 'Missing required fields: name, filename, rawContent, trace' },
        { status: 400 }
      );
    }

    // Calculate file size
    const fileSize = new Blob([rawContent]).size;

    // Check storage quota (example: 50MB limit per user)
    const { data: usage } = await supabaseAdmin
      .from('user_storage_usage')
      .select('total_mb')
      .eq('user_id', user.id)
      .single();

    // Type assertion for usage data
    const usageData = usage as { total_mb: number } | null;

    if (usageData && usageData.total_mb >= 50) {
      return NextResponse.json(
        { error: 'Storage quota exceeded. Maximum 50MB per user.' },
        { status: 403 }
      );
    }

    // Create trace first
    const { data: traceData, error: traceError } = await (supabaseAdmin
      .from('traces') as any)
      .insert({
        user_id: user.id,
        filename,
        raw_content: rawContent,
        parsed_data: trace as unknown as Record<string, unknown>,
        file_size: fileSize,
      })
      .select()
      .single();

    if (traceError || !traceData) {
      console.error('Error creating trace:', traceError);
      return NextResponse.json({ error: 'Failed to create trace' }, { status: 500 });
    }

    // Extract selection path
    const selectionPath = extractSelectionPath(trace);

    // Create baseline referencing the trace
    const { data: baselineData, error: baselineError } = await (supabaseAdmin
      .from('baselines') as any)
      .insert({
        user_id: user.id,
        name,
        filename,
        trace_id: traceData.id,
        selection_path: selectionPath,
      })
      .select()
      .single();

    if (baselineError || !baselineData) {
      console.error('Error creating baseline:', baselineError);
      // Clean up trace if baseline creation failed
      await supabaseAdmin.from('traces').delete().eq('id', traceData.id);
      return NextResponse.json({ error: 'Failed to create baseline' }, { status: 500 });
    }

    // Return created baseline
    return NextResponse.json({
      id: baselineData.id,
      name: baselineData.name,
      filename: baselineData.filename,
      selectionPath: baselineData.selection_path,
      createdAt: new Date(baselineData.created_at).getTime(),
      rawContent,
      trace,
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/baselines:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
