async function addTestTeams(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // List of test teams with academic marks
    const testTeams = [
      { naam: 'Span Alpha', mark: 85, bio: 'Alpha span se biografie', beskrywing: 'Alpha projek beskrywing' },
      { naam: 'Span Beta', mark: 78, bio: 'Beta span se biografie', beskrywing: 'Beta projek beskrywing' },
      { naam: 'Span Gamma', mark: 92, bio: 'Gamma span se biografie', beskrywing: 'Gamma projek beskrywing' },
      { naam: 'Span Delta', mark: 65, bio: 'Delta span se biografie', beskrywing: 'Delta projek beskrywing' },
      { naam: 'Span Epsilon', mark: 88, bio: 'Epsilon span se biografie', beskrywing: 'Epsilon projek beskrywing' },
      { naam: 'Span Zeta', mark: 73, bio: 'Zeta span se biografie', beskrywing: 'Zeta projek beskrywing' },
      { naam: 'Span Eta', mark: 95, bio: 'Eta span se biografie', beskrywing: 'Eta projek beskrywing' },
      { naam: 'Span Theta', mark: 82, bio: 'Theta span se biografie', beskrywing: 'Theta projek beskrywing' },
      { naam: 'Span Iota', mark: 77, bio: 'Iota span se biografie', beskrywing: 'Iota projek beskrywing' },
      { naam: 'Span Kappa', mark: 89, bio: 'Kappa span se biografie', beskrywing: 'Kappa projek beskrywing' },
      { naam: 'Span Lambda', mark: 91, bio: 'Lambda span se biografie', beskrywing: 'Lambda projek beskrywing' },
      { naam: 'Span Mu', mark: 84, bio: 'Mu span se biografie', beskrywing: 'Mu projek beskrywing' },
      { naam: 'Span Nu', mark: 76, bio: 'Nu span se biografie', beskrywing: 'Nu projek beskrywing' },
      { naam: 'Span Xi', mark: 93, bio: 'Xi span se biografie', beskrywing: 'Xi projek beskrywing' }
    ];

    for (const team of testTeams) {
      await client.query(
        'INSERT INTO span (naam, academic_mark, span_bio, projek_beskrywing) VALUES ($1, $2, $3, $4)',
        [team.naam, team.mark, team.bio, team.beskrywing]
      );
    }

    await client.query('COMMIT');
    res.json({ message: '14 spanne bygevoeg', success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error adding test teams:', err);
    res.status(500).json({ error: 'Kon nie spanne byvoeg nie' });
  } finally {
    client.release();
  }
}