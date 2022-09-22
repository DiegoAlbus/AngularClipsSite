import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { provideProtractorTestingSupport } from '@angular/platform-browser';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from 'src/app/services/auth.service';
import IUser from 'src/app/models/user.model';
import { RegisterValidators } from '../validators/register-validators';
import { EmailTaken } from '../validators/email-taken';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  constructor(private auth : AuthService, private emailTaken: EmailTaken){

  }

  inSubmission = false;

  name = new FormControl('', [
    Validators.required, // undefined, null or empty
    Validators.minLength(3)
  ]);
  email = new FormControl('',[
    Validators.required,
    Validators.email
  ], [this.emailTaken.validate]);
  age = new FormControl<number | null>(null,[
    Validators.required,
    Validators.min(18), // no users under the age of 18
    Validators.max(120)
  ]);
  password = new FormControl('', [
    Validators.required
    // Check
    // Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm) // Regexr pattern found https://regexr.com/
  ]);
  confirm_password = new FormControl('',[
    Validators.required
  ]);
  phoneNumber = new FormControl('', [
    Validators.required,
    Validators.minLength(9),
    Validators.maxLength(9)
  ]);

  showAlert = false;
  alertMsg = 'Please wait! Your account is being created';
  alertColor = 'blue';
  
  registerForm = new FormGroup({
    name: this.name,
    email: this.email,
    age: this.age,
    password: this.password,
    confirm_password: this.confirm_password,
    phoneNumber: this.phoneNumber
  }, [RegisterValidators.match('password', 'confirm_password')]);

  async register(){
    this.inSubmission = true;
    this.showAlert = true;
    this.alertMsg = 'Please wait! Your account is being created';
    this.alertColor = 'blue';

    try{
      await this.auth.createUser(this.registerForm.value as IUser);
    } catch (e) {
      // Handle response
      console.log(e);

      this.alertMsg = 'An unexpected error ocurred. Please try again later.';
      this.alertColor = 'red';
      this.inSubmission = false;
      return;
    }

    this.alertMsg = 'Your account has been created succesfully.';
    this.alertColor = 'green';

  }

}
