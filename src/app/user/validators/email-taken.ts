import { AngularFireAuth } from "@angular/fire/compat/auth";
import { Injectable } from "@angular/core"; // We need dependency injection
import { AbstractControl, AsyncValidator, ValidationErrors } from "@angular/forms";
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root'}) // R3InjectorError
export class EmailTaken implements AsyncValidator {
    constructor(private auth: AngularFireAuth){

    }

    validate = (control: AbstractControl<any, any>): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
        // https://angular.io/api/forms/AsyncValidator
        // https://firebase.google.com/docs/reference/js/auth#fetchsigninmethodsforemail

        return this.auth.fetchSignInMethodsForEmail(control.value).then(
            response => response.length? { emailTaken: true} : null
        );
    }
}
