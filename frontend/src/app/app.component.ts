import { Component, OnInit } from '@angular/core';

import { SqlOptimizerService } from './services/sql-optimizer.service';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { HttpClientModule } from '@angular/common/http';



interface OptimizationResult {

    original_query: string;

    optimized_query: string;

    tips: string[];

    estimated_improvement: string;

    explanation: string;

}



interface QueryHistoryItem {

    id: number;

    original_query: string;

    optimized_query: string;

    database_type: string;

    created_at: string;

    estimated_improvement: string;

}



@Component({

    selector: 'app-root',

    standalone: true,

    imports: [CommonModule, FormsModule, HttpClientModule],

    templateUrl: './app.component.html',

    styleUrls: ['./app.component.css'],

    providers: [SqlOptimizerService]  // ✅ Add service provider here

})

export class AppComponent implements OnInit {

    originalQuery: string = 'SELECT * FROM users WHERE age > 18;';

    databaseType: string = 'postgres';

    context: string = '';



    optimizedQuery: string = '';

    tips: string[] = [];

    improvement: string = '';

    explanation: string = '';



    loading: boolean = false;

    error: string = '';

    activeTab: string = 'input';

    history: QueryHistoryItem[] = [];

    stats: any = null;

    backendConnected: boolean = false;



    sqlEditorHeight: string = '400px';



    constructor(private sqlOptimizerService: SqlOptimizerService) {

        console.log('AppComponent initialized');

    }



    ngOnInit(): void {

        console.log('ngOnInit called');

        // Check backend connection

        this.checkBackendConnection();

        this.loadHistory();

        this.loadStats();

    }



    // ✅ Check if backend is running

    checkBackendConnection(): void {

        console.log('Checking backend connection...');

        this.sqlOptimizerService.healthCheck().subscribe({

            next: (response) => {

                console.log('Backend connected:', response);

                this.backendConnected = true;

                this.error = '';

            },

            error: (err) => {

                console.error('Backend connection failed:', err);

                this.backendConnected = false;

                this.error = '⚠️ Cannot connect to backend. Make sure backend is running on http://localhost:8001';

            }

        });

    }



    // ✅ Fixed: Line 109 - optimizeQuery method with better error handling

    optimizeQuery(): void {

        if (!this.originalQuery.trim()) {

            this.error = 'Please enter a SQL query';

            return;

        }



        if (!this.backendConnected) {

            this.error = '⚠️ Backend is not connected. Please start the backend server.';

            return;

        }



        this.loading = true;

        this.error = '';

        this.optimizedQuery = '';

        this.tips = [];



        console.log('Calling optimize endpoint with:', {

            query: this.originalQuery,

            database_type: this.databaseType,

            context: this.context

        });



        // ✅ LINE 109 - This is where the API call happens

        this.sqlOptimizerService

            .optimizeQuery({

                query: this.originalQuery,

                database_type: this.databaseType,

                context: this.context

            })

            .subscribe({

                next: (result: OptimizationResult) => {

                    console.log('Optimization successful:', result);

                    this.optimizedQuery = result.optimized_query;

                    this.tips = result.tips;

                    this.improvement = result.estimated_improvement;

                    this.explanation = result.explanation;

                    this.activeTab = 'output';

                    this.loading = false;

                    this.error = '';



                    this.loadHistory();

                    this.loadStats();

                },

                error: (err) => {

                    console.error('Optimization error:', err);



                    // ✅ Better error messages

                    if (err.status === 0) {

                        this.error = '❌ CORS Error or Backend Not Running. Check console for details.';

                    } else if (err.status === 404) {

                        this.error = '❌ Backend endpoint not found (404). Is backend running?';

                    } else if (err.status === 500) {

                        this.error = `❌ Backend Error: ${err.error?.detail || 'Internal server error'}`;

                    } else if (err.error?.detail) {

                        this.error = `❌ Error: ${err.error.detail}`;

                    } else {

                        this.error = `❌ Failed to optimize query: ${err.message || 'Unknown error'}`;

                    }



                    this.loading = false;

                }

            });

    }



    // ✅ Fixed: Line 123 - loadHistory method with better error handling

    loadHistory(): void {

        console.log('Loading history...');



        // ✅ LINE 123 - This is where the history API call happens

        this.sqlOptimizerService.getHistory(10).subscribe({

            next: (data: QueryHistoryItem[]) => {

                console.log('History loaded:', data);

                this.history = data;

            },

            error: (err) => {

                console.error('Failed to load history:', err);

                this.history = [];

                // Don't show error to user for history, just log it

            }

        });

    }



    loadStats(): void {

        console.log('Loading stats...');

        this.sqlOptimizerService.getStats().subscribe({

            next: (data: any) => {

                console.log('Stats loaded:', data);

                this.stats = data;

            },

            error: (err) => {

                console.error('Failed to load stats:', err);

                this.stats = null;

                // Don't show error to user for stats, just log it

            }

        });

    }



    loadFromHistory(item: QueryHistoryItem): void {

        console.log('Loading from history:', item);

        this.originalQuery = item.original_query;

        this.databaseType = item.database_type;

        this.optimizedQuery = item.optimized_query;

        this.activeTab = 'input';

    }



    copyToClipboard(text: string): void {

        navigator.clipboard.writeText(text).then(() => {

            alert('✅ Copied to clipboard!');

        }).catch(err => {

            console.error('Failed to copy:', err);

            alert('❌ Failed to copy to clipboard');

        });

    }



    getImprovementClass(): string {

        if (!this.improvement) return '';

        const percent = parseInt(this.improvement);

        if (percent >= 50) return 'improvement-high';

        if (percent >= 30) return 'improvement-medium';

        return 'improvement-low';

    }



    truncate(text: string, length: number): string {

        return text.length > length ? text.substring(0, length) + '...' : text;

    }

}