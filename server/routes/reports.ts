import { Request, Response } from 'express';
import { db } from '@db';
import { eq, sql, and, like, gte, lte, desc, asc, or, count, sum, avg } from 'drizzle-orm';
import { teams, events, users, paymentTransactions, eventFees, eventAgeGroups, eventBrackets } from '@db/schema';
import { log } from '../vite';
import { stringify } from 'csv-stringify/sync';
import { analyzeFinancialData, generateRecommendations, generateVisualizationCaption } from '../services/openai';

/**
 * Get Registration Orders Report
 * Provides a detailed report of team registration orders with payment information
 */
export async function getRegistrationOrdersReport(req: Request, res: Response) {
  try {
    const { 
      eventId, 
      status, 
      search, 
      startDate, 
      endDate,
      format = 'json' 
    } = req.query;

    // Build the base SQL query
    let query = db
      .select({
        id: paymentTransactions.id,
        teamId: paymentTransactions.teamId,
        eventId: paymentTransactions.eventId,
        paymentIntentId: paymentTransactions.paymentIntentId,
        amount: paymentTransactions.amount,
        paymentStatus: paymentTransactions.status,
        paymentMethodType: paymentTransactions.paymentMethodType,
        cardBrand: paymentTransactions.cardBrand,
        cardLast4: paymentTransactions.cardLastFour,
        submitterName: teams.submitterName,
        submitterEmail: teams.submitterEmail,
        teamName: teams.name,
        eventName: events.name,
        paymentDate: paymentTransactions.createdAt,
        notes: paymentTransactions.notes,
      })
      .from(paymentTransactions)
      .leftJoin(teams, eq(paymentTransactions.teamId, teams.id))
      .leftJoin(events, eq(paymentTransactions.eventId, events.id))
      .where(
        and(
          eq(paymentTransactions.transactionType, 'payment')
        )
      )
      .orderBy(desc(paymentTransactions.createdAt));

    // Apply filters
    if (eventId) {
      query = query.where(eq(paymentTransactions.eventId, String(eventId)));
    }

    if (status) {
      query = query.where(eq(paymentTransactions.status, String(status)));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(
        or(
          like(teams.name, searchTerm),
          like(teams.submitterName, searchTerm),
          like(teams.submitterEmail, searchTerm),
          like(paymentTransactions.paymentIntentId, searchTerm)
        )
      );
    }

    if (startDate) {
      query = query.where(gte(paymentTransactions.createdAt, new Date(String(startDate))));
    }

    if (endDate) {
      query = query.where(lte(paymentTransactions.createdAt, new Date(String(endDate))));
    }

    // Execute the query
    const transactions = await query;

    // Format the response based on requested format
    if (format === 'csv') {
      const csvData = stringify(transactions.map(tx => ({
        'Transaction ID': tx.id,
        'Event Name': tx.eventName,
        'Team Name': tx.teamName,
        'Payment ID': tx.paymentIntentId,
        'Amount': (tx.amount / 100).toFixed(2), // Convert cents to dollars
        'Payment Status': tx.paymentStatus,
        'Payment Method': tx.paymentMethodType,
        'Card Details': tx.cardBrand && tx.cardLast4 ? `${tx.cardBrand} **** ${tx.cardLast4}` : '',
        'Submitter Name': tx.submitterName,
        'Submitter Email': tx.submitterEmail,
        'Date': tx.paymentDate ? new Date(tx.paymentDate).toISOString() : '',
        'Notes': tx.notes
      })), { 
        header: true, 
        columns: [
          'Transaction ID',
          'Event Name',
          'Team Name',
          'Payment ID',
          'Amount',
          'Payment Status',
          'Payment Method',
          'Card Details',
          'Submitter Name',
          'Submitter Email',
          'Date',
          'Notes'
        ] 
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=registration-orders-${new Date().toISOString().slice(0, 10)}.csv`);
      return res.send(csvData);
    }

    // Default JSON response
    return res.json({
      success: true,
      transactions,
      count: transactions.length,
      filters: {
        eventId,
        status,
        search,
        startDate,
        endDate
      }
    });
  } catch (error) {
    log(`Error getting registration orders report: ${error}`, 'reports');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate registration orders report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Financial Overview Report
 * Provides a comprehensive overview of financial data with AI-powered insights
 */
export async function getFinancialOverviewReport(req: Request, res: Response) {
  try {
    const { 
      period = '30d', // 7d, 30d, 90d, year, all
      includeAI = 'true'
    } = req.query;
    
    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();
    
    switch(String(period)) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    // Get revenue overview
    const revenueQuery = await db
      .select({
        totalRevenue: sum(paymentTransactions.amount),
        transactionCount: count(paymentTransactions.id),
        avgTransactionValue: avg(paymentTransactions.amount),
      })
      .from(paymentTransactions)
      .where(
        and(
          eq(paymentTransactions.transactionType, 'payment'),
          eq(paymentTransactions.status, 'succeeded'),
          gte(paymentTransactions.createdAt, startDate),
          lte(paymentTransactions.createdAt, endDate)
        )
      );
    
    // Get top events by revenue
    const topEventsQuery = await db
      .select({
        eventId: paymentTransactions.eventId,
        eventName: events.name,
        revenue: sum(paymentTransactions.amount),
        transactionCount: count(paymentTransactions.id),
      })
      .from(paymentTransactions)
      .leftJoin(events, eq(paymentTransactions.eventId, events.id))
      .where(
        and(
          eq(paymentTransactions.transactionType, 'payment'),
          eq(paymentTransactions.status, 'succeeded'),
          gte(paymentTransactions.createdAt, startDate),
          lte(paymentTransactions.createdAt, endDate)
        )
      )
      .groupBy(paymentTransactions.eventId, events.name)
      .orderBy(desc(sum(paymentTransactions.amount)))
      .limit(5);
    
    // Get payment method distribution
    const paymentMethodsQuery = await db
      .select({
        paymentMethod: paymentTransactions.paymentMethodType,
        count: count(paymentTransactions.id),
        totalAmount: sum(paymentTransactions.amount),
      })
      .from(paymentTransactions)
      .where(
        and(
          eq(paymentTransactions.transactionType, 'payment'),
          eq(paymentTransactions.status, 'succeeded'),
          gte(paymentTransactions.createdAt, startDate),
          lte(paymentTransactions.createdAt, endDate)
        )
      )
      .groupBy(paymentTransactions.paymentMethodType)
      .orderBy(desc(sum(paymentTransactions.amount)));
    
    // Get monthly revenue trend
    const monthlyRevenueTrendQuery = await db.execute(sql`
      SELECT 
        DATE_TRUNC('month', created_at) AS month,
        SUM(amount) AS total_revenue,
        COUNT(*) AS transaction_count
      FROM payment_transactions
      WHERE 
        transaction_type = 'payment' 
        AND status = 'succeeded'
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC
    `);
    
    // Get refund data
    const refundsQuery = await db
      .select({
        totalRefunds: count(paymentTransactions.id),
        totalRefundAmount: sum(paymentTransactions.amount),
      })
      .from(paymentTransactions)
      .where(
        and(
          eq(paymentTransactions.transactionType, 'refund'),
          eq(paymentTransactions.status, 'succeeded'),
          gte(paymentTransactions.createdAt, startDate),
          lte(paymentTransactions.createdAt, endDate)
        )
      );
    
    const reportData = {
      period: String(period),
      timeRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      revenue: revenueQuery[0] || { totalRevenue: 0, transactionCount: 0, avgTransactionValue: 0 },
      topEvents: topEventsQuery,
      paymentMethods: paymentMethodsQuery,
      monthlyRevenueTrend: monthlyRevenueTrendQuery,
      refunds: refundsQuery[0] || { totalRefunds: 0, totalRefundAmount: 0 }
    };
    
    // Add AI-powered insights if requested
    let aiInsights = null;
    if (includeAI === 'true') {
      try {
        aiInsights = await analyzeFinancialData(reportData, 'summary');
        const recommendations = await generateRecommendations(reportData);
        
        aiInsights.recommendations = recommendations;
      } catch (error) {
        log(`Error generating AI insights: ${error}`, 'reports');
        // Continue without AI insights if they fail
      }
    }
    
    return res.json({
      success: true,
      data: reportData,
      aiInsights
    });
  } catch (error) {
    log(`Error getting financial overview report: ${error}`, 'reports');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate financial overview report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Event Financial Performance Report
 * Provides detailed financial performance metrics for specific events
 */
export async function getEventFinancialReport(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const { includeAI = 'true' } = req.query;
    
    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'Event ID is required'
      });
    }
    
    // Get event details
    const eventQuery = await db
      .select()
      .from(events)
      .where(eq(events.id, String(eventId)))
      .limit(1);
    
    if (!eventQuery.length) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    const event = eventQuery[0];
    
    // Get registration statistics
    const registrationsQuery = await db
      .select({
        totalTeams: count(teams.id),
        paidTeams: count(
          and(
            eq(teams.paymentStatus, 'paid')
          )
        ),
        pendingTeams: count(
          and(
            eq(teams.paymentStatus, 'pending')
          )
        ),
      })
      .from(teams)
      .where(eq(teams.eventId, String(eventId)));
    
    // Get financial statistics
    const financialsQuery = await db
      .select({
        totalRevenue: sum(paymentTransactions.amount),
        transactionCount: count(paymentTransactions.id),
        avgTransactionAmount: avg(paymentTransactions.amount),
      })
      .from(paymentTransactions)
      .where(
        and(
          eq(paymentTransactions.eventId, String(eventId)),
          eq(paymentTransactions.transactionType, 'payment'),
          eq(paymentTransactions.status, 'succeeded')
        )
      );
    
    // Get refunds for this event
    const refundsQuery = await db
      .select({
        totalRefunds: count(paymentTransactions.id),
        totalRefundAmount: sum(paymentTransactions.amount),
      })
      .from(paymentTransactions)
      .where(
        and(
          eq(paymentTransactions.eventId, String(eventId)),
          eq(paymentTransactions.transactionType, 'refund'),
          eq(paymentTransactions.status, 'succeeded')
        )
      );
    
    // Get revenue by age group
    const ageGroupRevenueQuery = await db.execute(sql`
      SELECT 
        eg.age_group, 
        eg.gender,
        COUNT(DISTINCT t.id) as team_count,
        SUM(pt.amount) as total_revenue
      FROM 
        event_age_groups eg
      LEFT JOIN 
        teams t ON eg.id = t.age_group_id
      LEFT JOIN 
        payment_transactions pt ON t.id = pt.team_id
      WHERE 
        eg.event_id = ${eventId}
        AND pt.transaction_type = 'payment'
        AND pt.status = 'succeeded'
      GROUP BY 
        eg.age_group, eg.gender
      ORDER BY 
        total_revenue DESC
    `);
    
    // Get revenue by day (registration timeline)
    const dailyRevenueQuery = await db.execute(sql`
      SELECT 
        DATE_TRUNC('day', created_at) AS day,
        SUM(amount) AS daily_revenue,
        COUNT(*) AS daily_registrations
      FROM 
        payment_transactions
      WHERE 
        event_id = ${eventId}
        AND transaction_type = 'payment'
        AND status = 'succeeded'
      GROUP BY 
        DATE_TRUNC('day', created_at)
      ORDER BY 
        day ASC
    `);
    
    const reportData = {
      event,
      registrations: registrationsQuery[0] || { totalTeams: 0, paidTeams: 0, pendingTeams: 0 },
      financials: financialsQuery[0] || { totalRevenue: 0, transactionCount: 0, avgTransactionAmount: 0 },
      refunds: refundsQuery[0] || { totalRefunds: 0, totalRefundAmount: 0 },
      ageGroupRevenue: ageGroupRevenueQuery,
      dailyRevenue: dailyRevenueQuery
    };
    
    // Add AI-powered insights if requested
    let aiInsights = null;
    if (includeAI === 'true') {
      try {
        aiInsights = await analyzeFinancialData(reportData, 'revenue');
        
        // Generate visualization captions
        const ageGroupCaption = await generateVisualizationCaption(
          reportData.ageGroupRevenue, 
          'bar chart'
        );
        
        const timelineCaption = await generateVisualizationCaption(
          reportData.dailyRevenue, 
          'line chart'
        );
        
        aiInsights.visualizationCaptions = {
          ageGroupRevenue: ageGroupCaption,
          dailyRevenue: timelineCaption
        };
      } catch (error) {
        log(`Error generating AI insights for event report: ${error}`, 'reports');
        // Continue without AI insights if they fail
      }
    }
    
    return res.json({
      success: true,
      data: reportData,
      aiInsights
    });
  } catch (error) {
    log(`Error getting event financial report: ${error}`, 'reports');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate event financial report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Fees Analysis Report
 * Analyzes fee structure and effectiveness across events
 */
export async function getFeesAnalysisReport(req: Request, res: Response) {
  try {
    const { includeAI = 'true' } = req.query;
    
    // Get overall fee statistics
    const feesQuery = await db
      .select({
        totalFees: count(eventFees.id),
        avgFeeAmount: avg(eventFees.amount),
        totalEvents: count(sql`DISTINCT ${eventFees.eventId}`),
      })
      .from(eventFees);
    
    // Get fee type distribution
    const feeTypeDistributionQuery = await db
      .select({
        feeType: eventFees.feeType,
        count: count(eventFees.id),
        avgAmount: avg(eventFees.amount),
      })
      .from(eventFees)
      .groupBy(eventFees.feeType)
      .orderBy(desc(count(eventFees.id)));
    
    // Get top performing fees (most revenue generated)
    const topPerformingFeesQuery = await db.execute(sql`
      SELECT 
        ef.id,
        ef.name,
        ef.fee_type,
        ef.amount,
        COUNT(DISTINCT pt.id) AS transactions,
        SUM(pt.amount) AS total_revenue,
        e.name AS event_name
      FROM 
        event_fees ef
      JOIN 
        events e ON ef.event_id = e.id
      LEFT JOIN 
        teams t ON CAST(t.selected_fee_ids AS TEXT) LIKE CONCAT('%', ef.id::TEXT, '%')
      LEFT JOIN 
        payment_transactions pt ON t.id = pt.team_id
      WHERE 
        pt.transaction_type = 'payment'
        AND pt.status = 'succeeded'
      GROUP BY 
        ef.id, ef.name, ef.fee_type, ef.amount, e.name
      ORDER BY 
        total_revenue DESC
      LIMIT 10
    `);
    
    // Get required vs optional fees performance
    const requiredVsOptionalQuery = await db.execute(sql`
      SELECT 
        is_required,
        COUNT(id) AS fee_count,
        AVG(amount) AS avg_amount,
        SUM(amount) AS total_potential_value
      FROM 
        event_fees
      GROUP BY 
        is_required
    `);
    
    const reportData = {
      feeStatistics: feesQuery[0] || { totalFees: 0, avgFeeAmount: 0, totalEvents: 0 },
      feeTypeDistribution: feeTypeDistributionQuery,
      topPerformingFees: topPerformingFeesQuery,
      requiredVsOptional: requiredVsOptionalQuery
    };
    
    // Add AI-powered insights if requested
    let aiInsights = null;
    if (includeAI === 'true') {
      try {
        aiInsights = await analyzeFinancialData(reportData, 'trends');
        const recommendations = await generateRecommendations(reportData);
        
        aiInsights.recommendations = recommendations;
      } catch (error) {
        log(`Error generating AI insights for fees report: ${error}`, 'reports');
        // Continue without AI insights if they fail
      }
    }
    
    return res.json({
      success: true,
      data: reportData,
      aiInsights
    });
  } catch (error) {
    log(`Error getting fees analysis report: ${error}`, 'reports');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate fees analysis report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}