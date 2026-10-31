import React, { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { PublicDataProvenance } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { evidenceStatusLabel, isSafeSourceUrl } from "@/lib/public-evidence";

export function MarketEvidenceDetails({
  source,
  sourceUrl,
  provenance,
}: {
  source: string;
  sourceUrl: string | null | undefined;
  provenance: PublicDataProvenance;
}) {
  const colors = useColors();
  const [openFailed, setOpenFailed] = useState(false);
  const citation = isSafeSourceUrl(sourceUrl) ? sourceUrl : null;
  const estimated = provenance.status === "ESTIMATED";

  return (
    <View style={[styles.card, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>Evidence and method</Text>
      <Text style={[styles.status, { color: estimated ? colors.warning : colors.primary }]}>
        {evidenceStatusLabel(provenance.status)}
      </Text>
      {estimated ? (
        <Text style={[styles.body, { color: colors.warning }]}>
          Not used to compare your pay or calculate decision scores.
        </Text>
      ) : null}
      <Text style={[styles.body, { color: colors.mutedForeground }]}>
        Source: {source} · {provenance.sourceType}
      </Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>
        Published {provenance.publicationDate} · retrieved {provenance.retrievedDate} · reviewed {provenance.reviewedAt}
      </Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>
        Metric: {provenance.metric}. Transformation: {provenance.transformation}
      </Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>
        Method: {provenance.methodologyName} v{provenance.methodologyVersion}. {provenance.methodologyCalculation}
      </Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>
        Inputs: {provenance.methodologyInputs.join(", ")}
      </Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>
        Limitations: {provenance.limitations.join(" ")}
      </Text>
      {citation ? (
        <>
          <Text selectable style={[styles.url, { color: colors.mutedForeground }]}>{citation}</Text>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Open cited market-data source"
            onPress={() => {
              void Linking.openURL(citation).catch(() => setOpenFailed(true));
            }}
            style={styles.link}
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>Open cited source</Text>
          </Pressable>
          {openFailed ? (
            <Text style={[styles.body, { color: colors.warning }]}>
              Could not open the link. The source URL is shown above.
            </Text>
          ) : null}
        </>
      ) : (
        <Text style={[styles.body, { color: colors.warning }]}>
          Citation unavailable. This record is not eligible for display as market evidence.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    gap: 8,
    marginTop: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
  },
  status: {
    fontSize: 12,
    fontWeight: "800",
  },
  body: {
    fontSize: 12,
    lineHeight: 18,
  },
  url: {
    fontSize: 11,
    lineHeight: 16,
  },
  link: {
    alignSelf: "flex-start",
    paddingVertical: 5,
  },
  linkText: {
    fontSize: 13,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
});
