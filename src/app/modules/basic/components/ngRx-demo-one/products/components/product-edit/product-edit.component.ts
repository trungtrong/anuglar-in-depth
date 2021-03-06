

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Subscription } from 'rxjs';

import { IProduct} from '@app/modules/basic/components/ngRx-demo-one/products/models/product.model';
import { ProductService} from '@app/modules/basic/components/ngRx-demo-one/products/services/product.service';
import {
    GenericValidator,
    NumberValidators
} from '@app/utilities';
import {Store} from '@ngrx/store';
import {getCurrentProduct, IProductState} from '@app/modules/basic/components/ngRx-demo-one/products/state/product.reducer';
import {ProductActions} from '@app/modules/basic/components/ngRx-demo-one/products/state/product.actions';

@Component({
    selector: 'app-product-edit',
    templateUrl: './product-edit.component.html'
})
export class ProductEditComponent implements OnInit, OnDestroy {
    pageTitle = 'Product Edit';
    errorMessage = '';
    productForm: FormGroup;

    product: IProduct | null;

    // Use with the generic validation message class
    displayMessage: { [key: string]: string } = {};
    private validationMessages: { [key: string]: { [key: string]: string } };
    private genericValidator: GenericValidator;

    sub: Subscription = Subscription.EMPTY;

    constructor(private store: Store<IProductState>,
                private fb: FormBuilder,
                private productService: ProductService) {

        // Defines all of the validation messages for the form.
        // These could instead be retrieved from a file or database.
        this.validationMessages = {
            productName: {
                required: 'Product name is required.',
                minlength: 'Product name must be at least three characters.',
                maxlength: 'Product name cannot exceed 50 characters.'
            },
            productCode: {
                required: 'Product code is required.'
            },
            starRating: {
                range: 'Rate the product between 1 (lowest) and 5 (highest).'
            }
        };

        // Define an instance of the validator for use with this form,
        // passing in this form's set of validation messages.
        this.genericValidator = new GenericValidator(this.validationMessages);
    }

    ngOnInit(): void {
        // Define the form group
        this.productForm = this.fb.group({
            productName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
            productCode: ['', Validators.required],
            starRating: ['', NumberValidators.range(1, 5)],
            description: ''
        });

        // Watch for changes to the currently selected product
        /*
        this.sub = this.productService.selectedProductChanges$.subscribe(
             currentProduct => this.displayProduct(currentProduct)
        );*/
        // this.sub.add()
        this.store.select(getCurrentProduct).subscribe((product) => {
            this.displayProduct(product);
        })

        // Watch for value changes for validation
        this.productForm.valueChanges.subscribe(
            () => this.displayMessage = this.genericValidator.processMessages(this.productForm)
        );
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    // Also validate on blur
    // Helpful if the user tabs through required fields
    blur(): void {
        this.displayMessage = this.genericValidator.processMessages(this.productForm);
    }

    displayProduct(product: IProduct | null): void {
        // Set the local product property
        this.product = product;

        if (product) {
            // Reset the form back to pristine
            this.productForm.reset();

            // Display the appropriate page title
            if (product.id === 0) {
                this.pageTitle = 'Add Product';
            } else {
                this.pageTitle = `Edit Product: ${product.productName}`;
            }

            // Update the data on the form
            this.productForm.patchValue({
                productName: product.productName,
                productCode: product.productCode,
                starRating: product.starRating,
                description: product.description
            });
        }
    }

    cancelEdit(product: IProduct): void {
        // Redisplay the currently selected product
        // replacing any edits made
        this.displayProduct(product);
    }

    deleteProduct(product: IProduct): void {
        if (product && product.id) {
            if (confirm(`Really delete the product: ${product.productName}?`)) {
                this.productService.deleteProduct(product.id).subscribe({
                    next: () => this.store.dispatch(ProductActions.clearCurrentProduct()),
                    error: err => this.errorMessage = err
                });
            }
        } else {
            // No need to delete, it was never saved
            this.store.dispatch(ProductActions.setCurrentProduct(null));
        }
    }

    saveProduct(originalProduct: IProduct): void {
        if (this.productForm.valid) {
            if (this.productForm.dirty) {
                // Copy over all of the original product properties
                // Then copy over the values from the form
                // This ensures values not on the form, such as the Id, are retained
                const product = { ...originalProduct, ...this.productForm.value };

                if (product.id === 0) {
                    this.productService.createProduct(product).subscribe({
                        next: (p) => this.store.dispatch(ProductActions.setCurrentProduct({product: p})),
                        error: err => this.errorMessage = err
                    });
                } else {
                    this.productService.updateProduct(product).subscribe({
                        next: p => this.store.dispatch(ProductActions.setCurrentProduct({product: p})),
                        error: err => this.errorMessage = err
                    });
                }
            }
        }
    }

}
