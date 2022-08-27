import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.css']
})
export class ManageComponent implements OnInit {
  videoOrder = '1';

  constructor(private router: Router, private route : ActivatedRoute) { }

  ngOnInit(): void {
    // this.route.data.subscribe(console.log);
    this.route.queryParamMap.subscribe((params: Params) => {
      this.videoOrder = params.sort === '2' ? params.sort : '1';
    });
  }

  sort (event: Event){
    const { value } = (event.target as HTMLSelectElement);

    // QUERY PARAMETERS
    // https://angular.io/api/router/Router#navigate

    // this.router.navigateByUrl(`/manage?sort=${value}`)
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sort: value
      }
    });
  }

}
