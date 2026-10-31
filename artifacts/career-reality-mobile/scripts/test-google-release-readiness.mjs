import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const releaseRecordPath = path.join(projectRoot, 'GOOGLE_SIGN_IN_RELEASE_TEST.md');
const appConfigPath = path.join(projectRoot, 'app.json');

const requiredPlatforms = ['iOS', 'Android'];
const requiredEnvironments = [
  'Development build installed on a physical device',
  'Published production mobile build installed from the release channel',
];

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim().replace(/^`|`$/g, ''));
}

function cleanResult(result) {
  return result.replace(/\*\*/g, '').trim().toUpperCase();
}

function getRequiredReleaseRows(record) {
  const section = record.match(
    /## Required release tester sign-off([\s\S]*?)(?=\n## |\s*$)/,
  )?.[1];
  assert.ok(
    section,
    'Google sign-in release record is missing the required release tester sign-off section.',
  );

  const lines = section.split('\n');
  const headerIndex = lines.findIndex((line) =>
    line.includes('| App version |') &&
    line.includes('| Release build identifier |') &&
    line.includes('| Platform |') &&
    line.includes('| Result |'),
  );
  assert.notEqual(
    headerIndex,
    -1,
    'Google sign-in release record must include App version and Release build identifier columns.',
  );

  const headers = parseTableRow(lines[headerIndex]);
  const separator = lines[headerIndex + 1];
  assert.ok(
    separator?.includes('| ---'),
    'Google sign-in release record sign-off table is missing its separator row.',
  );

  const index = Object.fromEntries(headers.map((header, position) => [header, position]));
  for (const requiredHeader of [
    'Test date (UTC)',
    'App version',
    'Release build identifier',
    'Build/environment',
    'Platform',
    'Result',
  ]) {
    assert.ok(
      Number.isInteger(index[requiredHeader]),
      `Google sign-in release record is missing the ${requiredHeader} column.`,
    );
  }

  const rows = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.trim().startsWith('|')) break;
    const cells = parseTableRow(line);
    rows.push({
      date: cells[index['Test date (UTC)']] ?? '',
      appVersion: cells[index['App version']] ?? '',
      buildIdentifier: cells[index['Release build identifier']] ?? '',
      environment: cells[index['Build/environment']] ?? '',
      platform: cells[index.Platform] ?? '',
      result: cells[index.Result] ?? '',
    });
  }

  return rows;
}

function getCurrentReleaseTarget(appConfig) {
  const expo = appConfig.expo;
  assert.ok(expo, 'app.json must define an expo configuration.');
  assert.ok(
    typeof expo.version === 'string' && expo.version.trim(),
    'app.json must define expo.version for Google sign-in release readiness.',
  );
  assert.ok(
    typeof expo.ios?.buildNumber === 'string' && expo.ios.buildNumber.trim(),
    'app.json must define ios.buildNumber for Google sign-in release readiness.',
  );
  assert.ok(
    Number.isInteger(expo.android?.versionCode) && expo.android.versionCode > 0,
    'app.json must define a positive android.versionCode for Google sign-in release readiness.',
  );

  return {
    version: expo.version.trim(),
    byPlatform: {
      iOS: String(expo.ios.buildNumber).trim(),
      Android: String(expo.android.versionCode),
    },
  };
}

function assertReleaseReadiness(rows, target) {
  const failures = [];

  for (const platform of requiredPlatforms) {
    for (const environment of requiredEnvironments) {
      const matchingRows = rows.filter(
        (row) => row.platform === platform && row.environment === environment,
      );

      if (matchingRows.length === 0) {
        failures.push(
          `${platform} / ${environment}: missing release sign-off row for ${target.version} build ${target.byPlatform[platform]}.`,
        );
        continue;
      }
      if (matchingRows.length > 1) {
        failures.push(
          `${platform} / ${environment}: duplicate release sign-off rows; keep one result for the current build.`,
        );
        continue;
      }

      const row = matchingRows[0];
      const expectedBuild = target.byPlatform[platform];
      const rowLabel = `${platform} / ${environment}`;

      if (!row.appVersion || row.appVersion === '—') {
        failures.push(
          `${rowLabel}: missing app version; record ${target.version} for the current release.`,
        );
      } else if (row.appVersion !== target.version) {
        failures.push(
          `${rowLabel}: stale result for app version ${row.appVersion}; current app version is ${target.version}.`,
        );
      }

      if (!row.buildIdentifier || row.buildIdentifier === '—') {
        failures.push(
          `${rowLabel}: missing release build identifier; record ${expectedBuild} for the current release.`,
        );
      } else if (row.buildIdentifier !== expectedBuild) {
        failures.push(
          `${rowLabel}: stale result for build ${row.buildIdentifier}; current ${platform} build is ${expectedBuild}.`,
        );
      }

      const result = cleanResult(row.result);
      if (!result.startsWith('PASS')) {
        failures.push(
          `${rowLabel}: missing current-build PASS (recorded ${result || 'blank'}).`,
        );
      }
    }
  }

  for (const row of rows) {
    if (!requiredPlatforms.includes(row.platform)) {
      failures.push(
        `Unexpected platform ${row.platform || 'blank'} in the required release sign-off table.`,
      );
    } else if (!requiredEnvironments.includes(row.environment)) {
      failures.push(
        `${row.platform}: unexpected release environment "${row.environment || 'blank'}" in the required sign-off table.`,
      );
    }
  }

  if (failures.length > 0) {
    console.error(
      `Google sign-in release readiness failed for app version ${target.version}.`,
    );
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Google sign-in release readiness passed for app version ${target.version}: iOS build ${target.byPlatform.iOS} and Android build ${target.byPlatform.Android} have current PASS results for both required environments.`,
  );
}

const [record, appConfigSource] = await Promise.all([
  readFile(releaseRecordPath, 'utf8'),
  readFile(appConfigPath, 'utf8'),
]);

let appConfig;
try {
  appConfig = JSON.parse(appConfigSource);
} catch (error) {
  throw new Error(`app.json is not valid JSON: ${error.message}`);
}

const target = getCurrentReleaseTarget(appConfig);
const rows = getRequiredReleaseRows(record);
assert.ok(rows.length > 0, 'Google sign-in release record has no release sign-off rows.');
assertReleaseReadiness(rows, target);