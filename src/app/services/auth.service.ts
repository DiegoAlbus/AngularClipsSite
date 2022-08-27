import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import IUser from '../models/user.model';
import { delay, map, filter, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ActivatedRoute, NavigationEnd } from '@angular/router';

// https://angular.io/api/router/Router

@Injectable({
  providedIn: 'root'
})
  export class AuthService {
  
    private usersCollection: AngularFirestoreCollection<IUser>;
    public isAuthenticated$ : Observable<boolean> // $ common practice for observables
    public isAuthenticatedWithDelay$: Observable<boolean>;
    private redirect = false;

  constructor(private auth: AngularFireAuth, private db: AngularFirestore, private router: Router, private route: ActivatedRoute){
    this.usersCollection = db.collection('users');
    this.isAuthenticated$ = auth.user.pipe(
      map(user => !!user)
    );

    this.isAuthenticatedWithDelay$ = this.isAuthenticated$.pipe(
      delay(1000)
    );

    // auth.user.subscribe(console.log);
    // this.route.data.subscribe(console.log);
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => this.route.firstChild),
      switchMap(route => route?.data ?? of({})) // ?? -> Will check if value is null / undefined to the left else an empty object on the right
    ).subscribe(data => {
      this.redirect = data.authOnly ?? false;
    });
  }

  public async createUser(userData: IUser) {

    // const {email, password} = this.registerForm.value;
    if (!userData.password) {
      throw new Error("Password not provided");
    }

    // FIRST IT AUTENTICATES
    const userCred = await this.auth.createUserWithEmailAndPassword(userData.email as string, userData.password); // Sends request to firebase
      // console.log(userCred);
      
    if (!userCred.user){
      throw new Error("User can't be found");
    }

    // THEN IT WRITES TO DATABASE
      await this.usersCollection.doc(userCred.user?.uid).set({ // Looks for user ID
        name : userData.name,
        email: userData.email,
        age: userData.age,
        phoneNumber: userData.phoneNumber
      });

      await userCred.user.updateProfile({
        displayName: userData.name
      })
  }

  public async logout($event?: Event){
    if ($event) {
      $event.preventDefault()
    }
    await this.auth.signOut();
    
    // if returns a promise await

    if (this.redirect) {
      await this.router.navigateByUrl('/');
    }

  }
}
