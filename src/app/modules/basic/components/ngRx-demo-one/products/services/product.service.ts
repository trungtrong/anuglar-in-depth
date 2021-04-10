import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

import {IProduct} from '@app/modules/basic/components/ngRx-demo-one/products/models/product.model';

@Injectable({
    providedIn: 'root',
})
export class ProductService {
    private productsUrl = 'api/products';
    private products: IProduct[];

    private selectedProductSource = new BehaviorSubject<IProduct | null>(null);
    selectedProductChanges$ = this.selectedProductSource.asObservable();

    constructor(private http: HttpClient) { }

    changeSelectedProduct(selectedProduct: IProduct | null): void {
        this.selectedProductSource.next(selectedProduct);
    }

    getProducts(): Observable<IProduct[]> {
        if (this.products) {
            return of(this.products);
        }
        return this.http.get<IProduct[]>(this.productsUrl)
            .pipe(
                tap(data => console.log(JSON.stringify(data))),
                tap(data => this.products = data),
                catchError(this.handleError)
            );
    }

    // Return an initialized product
    newProduct(): IProduct {
        return {
            id: 0,
            productName: '',
            productCode: 'New',
            description: '',
            starRating: 0
        };
    }

    createProduct(product: IProduct): Observable<IProduct> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        // Product Id must be null for the Web API to assign an Id
        const newProduct = { ...product, id: null };
        return this.http.post<IProduct>(this.productsUrl, newProduct, { headers })
            .pipe(
                tap(data => console.log('createProduct: ' + JSON.stringify(data))),
                tap(data => {
                    this.products.push(data);
                }),
                catchError(this.handleError)
            );
    }

    deleteProduct(id: number): Observable<{}> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const url = `${this.productsUrl}/${id}`;
        return this.http.delete<IProduct>(url, { headers })
            .pipe(
                tap(data => console.log('deleteProduct: ' + id)),
                tap(data => {
                    const foundIndex = this.products.findIndex(item => item.id === id);
                    if (foundIndex > -1) {
                        this.products.splice(foundIndex, 1);
                    }
                }),
                catchError(this.handleError)
            );
    }

    updateProduct(product: IProduct): Observable<IProduct> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const url = `${this.productsUrl}/${product.id}`;
        return this.http.put<IProduct>(url, product, { headers })
            .pipe(
                tap(() => console.log('updateProduct: ' + product.id)),
                // Update the item in the list
                // This is required because the selected product that was edited
                // was a copy of the item from the array.
                tap(() => {
                    const foundIndex = this.products.findIndex(item => item.id === product.id);
                    if (foundIndex > -1) {
                        this.products[foundIndex] = product;
                    }
                }),
                // Return the product on an update
                map(() => product),
                catchError(this.handleError)
            );
    }

    private handleError(err: any) {
        // in a real world app, we may send the server to some remote logging infrastructure
        // instead of just logging it to the console
        let errorMessage: string;
        if (err.error instanceof ErrorEvent) {
            // A client-side or network error occurred. Handle it accordingly.
            errorMessage = `An error occurred: ${err.error.message}`;
        } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            errorMessage = `Backend returned code ${err.status}: ${err.body.error}`;
        }
        console.error(err);
        return throwError(errorMessage);
    }

}
