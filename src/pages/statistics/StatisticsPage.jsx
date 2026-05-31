import React, { useEffect, useState } from 'react';
import { myStatistics } from "../../services/userProfileService.js";
import styles from './StatisticsPage.module.css';

function StatisticsPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await myStatistics();
                if (response.success) {
                    setStats(response.data);
                }
            } catch (err) {
                setError("Failed to load statistics.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className={styles.statisticsStatus}>Loading statistics...</div>;
    if (error) return <div className={`${styles.statisticsStatus} ${styles.error}`}>{error}</div>;
    if (!stats) return <div className={styles.statisticsStatus}>No data available.</div>;

    return (
        <div className={styles.statisticsContainer}>
            <h2 className={styles.statisticsTitle}>Player Statistics</h2>

            <div className={styles.statsGridContainer}>

                <div className={styles.statItem}>
                    <span className={`${styles.statValue} ${styles.colorBlue}`}>{stats.numberOfRace}</span>
                    <span className={styles.statLabel}>Races Played</span>
                </div>

                <div className={styles.statItem}>
                    <span className={`${styles.statValue} ${styles.colorYellow}`}>{stats.numberOfVictories}</span>
                    <span className={styles.statLabel}>Total Wins</span>
                </div>

                <div className={styles.statItem}>
                    <span className={`${styles.statValue} ${styles.colorGreen}`}>
                        {Number(stats.avgAccuracy.toFixed(2))}%
                    </span>
                    <span className={styles.statLabel}>Average Accuracy</span>
                </div>

                <div className={styles.statItem}>
                    <span className={`${styles.statValue} ${styles.colorText}`}>
                        {Number((stats.avgSuccessTimeMs / 1000).toFixed(2))}s
                    </span>
                    <span className={styles.statLabel}>Avg. Success Time</span>
                </div>

                <div className={styles.statItem}>
                    <span className={`${styles.statValue} ${styles.colorRed}`}>{stats.maxStreak}</span>
                    <span className={styles.statLabel}>Max Streak</span>
                </div>

            </div>
        </div>
    );
}

export default StatisticsPage;