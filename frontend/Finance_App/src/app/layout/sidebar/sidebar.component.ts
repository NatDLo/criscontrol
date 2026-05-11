import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule, NgClass],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  @Input() isOpen = true;

  readonly navItems: NavItem[] = [
    { path: '/dashboard',    label: 'Dashboard',       icon: 'dashboard' },
    { path: '/transactions', label: 'Transacciones',   icon: 'receipt_long' },
    { path: '/categories',   label: 'Categorías',      icon: 'category' },
    { path: '/reports',      label: 'Reportes',        icon: 'bar_chart' },
  ];
}
