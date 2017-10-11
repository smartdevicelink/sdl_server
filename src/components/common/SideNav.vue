<template>
    <nav class="col-sm-3 col-md-2 d-none d-sm-block nav-bg sidebar">
        <ul class="nav nav-pills flex-column">
            <router-link tag="li" class="nav-item" to="/applications" active-class="active">
                <a class="nav-link">Applications <span class="badge badge-circle badge-danger">4</span></a>
            </router-link>
            <router-link tag="li" class="nav-item" to="/policytable" active-class="active">
                <a class="nav-link">View Policy Table</a>
            </router-link>
            <router-link tag="li" class="nav-item" to="/functionalgroups" active-class="active">
                <a class="nav-link">Functional Groups <span class="badge badge-circle badge-danger">1</span></a>
            </router-link>
        </ul>
    </nav>
</template>