// This is a backup of the original createSetupIntent function
export async function createSetupIntent_ORIGINAL(
  teamId: number | string,
  metadata?: Record<string, string>,
) {
  try {
    log(`Creating setup intent for team: ${teamId}`);

    // CRITICAL FIX: Create or get customer for charging capability
    let customerId: string | undefined;

    // For real teams (not temp), create/get customer based on team info
    if (typeof teamId === "number" || !teamId.toString().startsWith("temp-")) {
      try {
        const numericTeamId =
          typeof teamId === "number" ? teamId : parseInt(teamId.toString());
        const existingTeam = await db.query.teams.findFirst({
          where: eq(teams.id, numericTeamId),
          columns: {
            stripeCustomerId: true,
            submitterEmail: true,
            submitterName: true,
            name: true,
          },
        });

        if (existingTeam?.stripeCustomerId) {
          customerId = existingTeam.stripeCustomerId;
          log(`Using existing customer ID: ${customerId} for team ${teamId}`);
        } else if (existingTeam?.submitterEmail) {
          // Create new customer for this team
          const customer = await stripe.customers.create({
            email: existingTeam.submitterEmail,
            name: existingTeam.submitterName || "Team Manager",
            metadata: {
              teamId: teamId.toString(),
              teamName: existingTeam.name || "Unknown Team",
            },
          });
          customerId = customer.id;

          // Store customer ID in database for future use
          await db
            .update(teams)
            .set({ stripeCustomerId: customerId })
            .where(eq(teams.id, numericTeamId));

          log(`Created new customer: ${customerId} for team ${teamId}`);
        }
      } catch (customerError: any) {
        log(
          `Could not create/retrieve customer for team ${teamId}: ${customerError.message}`,
        );
        // Continue without customer - will limit charging ability but still allow Setup Intent creation
      }
    } else {
      // For temp team IDs during registration, create a customer using metadata
      if (metadata?.userEmail) {
        try {
          const customer = await stripe.customers.create({
            email: metadata.userEmail,
            name: metadata.userName || "Team Manager",
            metadata: {
              teamId: teamId.toString(),
              teamName: metadata.teamName || "Unknown Team",
              createdFor: "temp_team_registration",
            },
          });
          customerId = customer.id;
          log(
            `Created customer ${customerId} for temp team ${teamId} during registration`,
          );
        } catch (customerError: any) {
          log(
            `Could not create customer for temp team ${teamId}: ${customerError.message}`,
          );
        }
      } else {
        log(
          `WARNING: No user email provided for temp team ${teamId} - cannot create customer`,
        );
      }
    }

    const setupIntentData: any = {
      // Use specific payment_method_types to only allow card payments (no Link)
      payment_method_types: ["card"],
      usage: "off_session", // This allows for future use without customer being present
      metadata: {
        teamId: teamId.toString(),
        ...metadata,
      },
    };

    // Add customer if we have one (critical for charging later)
    if (customerId) {
      setupIntentData.customer = customerId;
      log(`Setup Intent will be created with customer: ${customerId}`);
    } else {
      log(
        `WARNING: Setup Intent created without customer - charging will be limited`,
      );
    }

    const setupIntent = await stripe.setupIntents.create(setupIntentData);

    // Only update the team in the database if it's a numeric ID (not a temp ID)
    // AND only if the team doesn't already have a confirmed Setup Intent
    if (typeof teamId === "number" || !teamId.toString().startsWith("temp-")) {
      try {
        const numericTeamId =
          typeof teamId === "number" ? teamId : parseInt(teamId.toString());

        // Check if team already has a Setup Intent
        const existingTeam = await db.query.teams.findFirst({
          where: eq(teams.id, numericTeamId),
          columns: {
            setupIntentId: true,
            paymentStatus: true,
          },
        });

        // Only update if no existing Setup Intent or existing one is not completed
        if (
          !existingTeam?.setupIntentId ||
          existingTeam?.paymentStatus === "pending"
        ) {
          log(
            `Updating team ${numericTeamId} with Setup Intent: ${setupIntent.id}`,
          );
          await db
            .update(teams)
            .set({
              setupIntentId: setupIntent.id,
              paymentStatus: "payment_info_provided",
            })
            .where(eq(teams.id, numericTeamId));
        } else {
          log(
            `Team ${numericTeamId} already has Setup Intent ${existingTeam.setupIntentId}, skipping database update to preserve confirmed payment info`,
          );
        }
      } catch (dbError: any) {
        console.warn(
          `Could not update team record with setup intent ID, likely a temporary team: ${dbError.message}`,
        );
      }
    }

    return {
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    };
  } catch (error: any) {
    console.error("Error creating setup intent:", error);
    throw new Error(`Error creating setup intent: ${error.message}`);
  }
}