import { Injectable } from '@angular/core';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { Observable, throwError } from 'rxjs';

import { catchError } from 'rxjs/operators';



export interface OptimizeRequest {

    query: string;

    database_type: string;

    context?: string;

}



export interface OptimizeResponse {

    original_query: string;

    optimized_query: string;

    tips: string[];

    estimated_improvement: string;

    explanation: string;

}



export interface QueryHistory {

    id: number;

    original_query: string;

    optimized_query: string;

    database_type: string;

    created_at: string;

    estimated_improvement: string;

}



export interface StatsResponse {

    total_queries_analyzed: number;

    by_database_type: {

        [key: string]: number;

    };

}



@Injectable({

    providedIn: 'root'

})

export class SqlOptimizerService {

    // ✅ CRITICAL: Make sure this URL is correct

    private apiUrl = 'http://localhost:8001';



    constructor(private http: HttpClient) {

        console.log('SqlOptimizerService initialized');

        console.log('API URL:', this.apiUrl);



        // Check for environment override

        const envUrl = (window as any)['API_URL'];

        if (envUrl) {

            this.apiUrl = envUrl;

            console.log('Using environment API URL:', this.apiUrl);

        }

    }



    // ✅ Health check to verify backend is running

    healthCheck(): Observable<any> {

        console.log('Health check to:', `${this.apiUrl}/health`);

        return this.http.get(`${this.apiUrl}/health`)

            .pipe(

                catchError(error => {

                    console.error('Health check failed:', error);

                    return throwError(() => error);

                })

            );

    }



    // ✅ Optimize query endpoint

    optimizeQuery(request: OptimizeRequest): Observable<OptimizeResponse> {

        const url = `${this.apiUrl}/optimize`;

        console.log('Calling optimize endpoint:', url);

        console.log('Request data:', request);



        return this.http.post<OptimizeResponse>(url, request)

            .pipe(

                catchError(this.handleError)

            );

    }



    // ✅ Get query history

    getHistory(limit: number = 20): Observable<QueryHistory[]> {

        const url = `${this.apiUrl}/history?limit=${limit}`;

        console.log('Getting history from:', url);



        return this.http.get<QueryHistory[]>(url)

            .pipe(

                catchError(error => {

                    console.error('History fetch failed:', error);

                    return throwError(() => error);

                })

            );

    }



    // ✅ Get statistics

    getStats(): Observable<StatsResponse> {

        const url = `${this.apiUrl}/stats`;

        console.log('Getting stats from:', url);



        return this.http.get<StatsResponse>(url)

            .pipe(

                catchError(error => {

                    console.error('Stats fetch failed:', error);

                    return throwError(() => error);

                })

            );

    }



    // ✅ Error handler

    private handleError(error: HttpErrorResponse) {

        console.error('HTTP Error:', error);



        let errorMessage = 'An error occurred';



        if (error.error instanceof ErrorEvent) {

            // Client-side error

            errorMessage = `Error: ${error.error.message}`;

        } else {

            // Server-side error

            errorMessage = `Backend Error: ${error.status} - ${error.message}`;

        }



        console.error(errorMessage);

        return throwError(() => error);

    }

}